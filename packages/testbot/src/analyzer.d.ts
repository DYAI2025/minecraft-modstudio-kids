export interface LogAnalysis {
    status: 'running' | 'success' | 'crashed' | 'unknown';
    crashReason?: string;
}
export declare class LogAnalyzer {
    private buffer;
    private _state;
    get state(): LogAnalysis;
    processLine(line: string): LogAnalysis;
}
