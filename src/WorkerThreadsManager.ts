// Create a class that manages the worker threads
// Path: src/WorkerThreads.ts
// import { Worker } from 'worker_threads';

export class WorkerThread {
    private manager : WorkerThreadsManager
    private worker : Worker;
    private  active = false;
    constructor(script: string, manager: WorkerThreadsManager) {
        this.worker = new Worker(new URL(script, import.meta.url), { type: 'module' });
        this.manager = manager;
        this.worker.onmessage = (m) => {
            this.manager.OnExit(this, m.data);
        };
    }

    get IsActive(): boolean {
        return this.active;
    }

    set IsActive(value: boolean) {
        this.active = value;
    }

    Signal(message : any) {
        if (this.active) {
            throw new Error("Worker is already active");
        }
        this.active = true;
        this.worker.postMessage(message);
    }
}


export class WorkerThreadsManager {
    // create pool of workers
    private workers: WorkerThread[];
    private numWorkers: number;
    private onWorkerComplete : (data: any) => void;

    constructor(script: string, numWorkers: number, onWorkerComplete: (data: any) => void) {
        this.workers = Array.from({ length: numWorkers }, () => new WorkerThread(script, this));
        this.numWorkers = numWorkers;
        this.onWorkerComplete = onWorkerComplete;
    }

    Schedule(message : any) {
        // find the first available worker
        let worker = this.workers.find(w => !w.IsActive);
        if (worker == null) {
            throw new Error("No available workers");
        }

        worker.Signal(message);
    }

    OnExit(worker: WorkerThread, data: any) {
        worker.IsActive = false;
        this.onWorkerComplete("Worker is complete, data: " + data);
    }
}