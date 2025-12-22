declare module 'node-pty' {
  export interface IPty {
    pid: number;
    cols: number;
    rows: number;
    process: string;
    handleFlowControl: boolean;
    onData(callback: (data: string) => void): void;
    onExit(callback: (exitCode: { exitCode: number; signal?: number }) => void): void;
    write(data: string): void;
    resize(cols: number, rows: number): void;
    kill(signal?: string): void;
    pause(): void;
    resume(): void;
  }

  export function spawn(file: string, args: string[], options: any): IPty;
}