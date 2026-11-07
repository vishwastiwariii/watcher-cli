export interface CpuSnapshot {
    total: number, 
    idle: number
}

export interface ProcessCpuSnapshot {
    processTime: number, 
    totalCpuTime: number
}