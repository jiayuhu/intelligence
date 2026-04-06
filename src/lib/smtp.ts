import net from "node:net";
import tls from "node:tls";

type SmtpSocket = net.Socket | tls.TLSSocket;

interface SmtpResponse {
  code: number;
  lines: string[];
}

class SmtpSession {
  private socket: SmtpSocket;
  private buffer = "";
  private collector: {
    resolve: (value: SmtpResponse) => void;
    reject: (reason: unknown) => void;
    lines: string[];
  } | null = null;

  constructor(socket: SmtpSocket) {
    this.socket = socket;
    this.socket.setEncoding("utf8");
    this.socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      void this.flush();
    });
    this.socket.on("error", (error: unknown) => {
      this.collector?.reject(error);
      this.collector = null;
    });
    this.socket.on("close", () => {
      if (this.collector) {
        this.collector.reject(new Error("SMTP 连接已关闭"));
        this.collector = null;
      }
    });
  }

  attach(socket: SmtpSocket): void {
    this.socket = socket;
    this.socket.setEncoding("utf8");
    this.socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      void this.flush();
    });
    this.socket.on("error", (error: unknown) => {
      this.collector?.reject(error);
      this.collector = null;
    });
    this.socket.on("close", () => {
      if (this.collector) {
        this.collector.reject(new Error("SMTP 连接已关闭"));
        this.collector = null;
      }
    });
  }

  send(command: string): void {
    this.socket.write(`${command}\r\n`);
  }

  sendData(data: string): void {
    this.socket.write(data);
  }

  close(): void {
    this.socket.end();
  }

  readResponse(): Promise<SmtpResponse> {
    if (this.collector) {
      throw new Error("SMTP 响应正在等待中");
    }
    return new Promise<SmtpResponse>((resolve, reject) => {
      this.collector = { resolve, reject, lines: [] };
      void this.flush();
    });
  }

  private async flush(): Promise<void> {
    if (!this.collector) {
      return;
    }

    let newlineIndex = this.buffer.indexOf("\n");
    while (newlineIndex >= 0 && this.collector) {
      const rawLine = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);
      const line = rawLine.replace(/\r$/, "");
      this.collector.lines.push(line);
      if (/^\d{3} /.test(line)) {
        const code = Number.parseInt(line.slice(0, 3), 10);
        const response = { code, lines: [...this.collector.lines] };
        const resolve = this.collector.resolve;
        this.collector = null;
        resolve(response);
        return;
      }
      newlineIndex = this.buffer.indexOf("\n");
    }
  }
}

function createSocket(args: { host: string; port: number; secure: boolean }): Promise<SmtpSocket> {
  return new Promise((resolve, reject) => {
    const onConnect = (socket: SmtpSocket) => {
      socket.once("error", reject);
      resolve(socket);
    };

    if (args.secure) {
      const socket = tls.connect({
        host: args.host,
        port: args.port,
        servername: args.host,
      });
      socket.once("secureConnect", () => onConnect(socket));
      socket.once("error", reject);
      return;
    }

    const socket = net.connect({
      host: args.host,
      port: args.port,
    });
    socket.once("connect", () => onConnect(socket));
    socket.once("error", reject);
  });
}

function upgradeToTls(socket: net.Socket, host: string): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({
      socket,
      servername: host,
    });
    secureSocket.once("secureConnect", () => resolve(secureSocket));
    secureSocket.once("error", reject);
  });
}

function expectCode(response: SmtpResponse, expected: number | number[], context: string): void {
  const values = Array.isArray(expected) ? expected : [expected];
  if (!values.includes(response.code)) {
    throw new Error(`${context} 返回码异常：${response.lines.join(" | ")}`);
  }
}

function dotStuff(message: string): string {
  return message
    .replace(/\r?\n/g, "\n")
    .split("\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

export async function sendEmailViaSmtp(args: {
  host: string;
  port: number;
  secure: boolean;
  starttls: boolean;
  username?: string;
  password?: string;
  heloHost: string;
  from: string;
  to: string[];
  rawMessage: string;
}): Promise<void> {
  let socket = await createSocket({
    host: args.host,
    port: args.port,
    secure: args.secure,
  });
  const session = new SmtpSession(socket);

  expectCode(await session.readResponse(), 220, "SMTP 握手");
  session.send(`EHLO ${args.heloHost}`);
  expectCode(await session.readResponse(), 250, "EHLO");

  if (args.starttls && !args.secure) {
    session.send("STARTTLS");
    expectCode(await session.readResponse(), 220, "STARTTLS");
    socket = await upgradeToTls(socket as net.Socket, args.host);
    session.attach(socket);
    session.send(`EHLO ${args.heloHost}`);
    expectCode(await session.readResponse(), 250, "EHLO(TLS)");
  }

  if (args.username && args.password) {
    session.send("AUTH LOGIN");
    expectCode(await session.readResponse(), 334, "AUTH LOGIN");
    session.send(Buffer.from(args.username, "utf8").toString("base64"));
    expectCode(await session.readResponse(), 334, "AUTH USER");
    session.send(Buffer.from(args.password, "utf8").toString("base64"));
    expectCode(await session.readResponse(), 235, "AUTH PASS");
  }

  session.send(`MAIL FROM:<${args.from}>`);
  expectCode(await session.readResponse(), 250, "MAIL FROM");

  for (const recipient of args.to) {
    session.send(`RCPT TO:<${recipient}>`);
    expectCode(await session.readResponse(), [250, 251], `RCPT TO ${recipient}`);
  }

  session.send("DATA");
  expectCode(await session.readResponse(), 354, "DATA");
  session.sendData(`${dotStuff(args.rawMessage)}\r\n.\r\n`);
  expectCode(await session.readResponse(), 250, "邮件正文");

  session.send("QUIT");
  expectCode(await session.readResponse(), 221, "QUIT");
  session.close();
}
