export interface LogAnalysis {
    status: 'running' | 'success' | 'crashed' | 'unknown';
    crashReason?: string;
}

export class LogAnalyzer {
    private buffer: string[] = [];
    private _state: LogAnalysis = { status: 'running' };

    public get state() { return this._state; }

    processLine(line: string): LogAnalysis {
        this.buffer.push(line);
        const lower = line.toLowerCase();

        // Check Success
        // Server: "Done (2.541s)! For help, type 'help'"
        // Client: "Backend library: LWJGL version 3.2.2 build 10" (sometimes earlier) 
        // Better Client: "Sound engine started" is usually late enough.
        if (line.includes("Done (") && line.includes(")! For help, type")) {
             this._state = { status: 'success' };
        }

        // Check Crashes
        if (lower.includes("exception in thread") || lower.includes("fatal error")) {
            this._state = { status: 'crashed', crashReason: line };
        }
        
        // Fabric specific
        if (line.includes("Incompatible mod set!")) {
             this._state = { status: 'crashed', crashReason: "Incompatible mods" };
        }

        if (line.includes("Mixin apply failed")) {
             this._state = { status: 'crashed', crashReason: "Mixin application failed (Code error)" };
        }

        return this._state;
    }
}
