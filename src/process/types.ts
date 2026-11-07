export interface ProcessInfo {
    pid: number, 
    ppid: number, 
    processName: string, 
    state: string

    utime: number       // time spent in user mode
    stime: number       // time spent in kernal mode
    rss: number
}