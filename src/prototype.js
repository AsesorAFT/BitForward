// Prototipo de BitForward
// Fecha: 2025-09-19

class BitForward {
    constructor() {
        this.projects = [];
        this.contracts = [];
        this.currentUser = null;
    }

    // --- Métodos de Autenticación ---

    login(username, password) {
        // Lógica de autenticación simulada
        if (username && password) {
            this.currentUser = { username };
            console.log(`Bienvenido, ${username}.`);
            return true;
        }
        console.log("Credenciales incorrectas.");
        return false;
    }

    logout() {
        console.log(`Hasta luego, ${this.currentUser.username}.`);
        this.currentUser = null;
    }

    // --- Métodos de Gestión de Proyectos ---

    createProject(projectName, description) {
        if (!this.currentUser) {
            console.log("Error: Debes iniciar sesión para crear un proyecto.");
            return null;
        }
        const project = {
            id: Date.now(),
            name: projectName,
            description: description,
            owner: this.currentUser.username,
            tasks: [],
            files: []
        };
        this.projects.push(project);
        console.log(`Proyecto "${projectName}" creado exitosamente.`);
        return project;
    }

    getProjects() {
        return this.projects;
    }

    getProject(projectId) {
        return this.projects.find(project => project.id === projectId);
    }

    deleteProject(projectId) {
        if (!this.currentUser) {
            console.log("Error: Debes iniciar sesión para eliminar un proyecto.");
            return false;
        }
        const projectIndex = this.projects.findIndex(project => project.id === projectId);
        if (projectIndex !== -1) {
            const project = this.projects[projectIndex];
            if (project.owner === this.currentUser.username) {
                this.projects.splice(projectIndex, 1);
                console.log(`Proyecto "${project.name}" eliminado exitosamente.`);
                return true;
            } else {
                console.log("Error: Solo puedes eliminar tus propios proyectos.");
                return false;
            }
        }
        console.log("Error: Proyecto no encontrado.");
        return false;
    }

    // --- Métodos de Gestión de Tareas ---

    addTask(projectId, taskName, description, dueDate = null) {
        if (!this.currentUser) {
            console.log("Error: Debes iniciar sesión para agregar una tarea.");
            return null;
        }
        const project = this.getProject(projectId);
        if (!project) {
            console.log("Error: Proyecto no encontrado.");
            return null;
        }
        if (project.owner !== this.currentUser.username) {
            console.log("Error: Solo puedes agregar tareas a tus propios proyectos.");
            return null;
        }
        const task = {
            id: Date.now(),
            name: taskName,
            description: description,
            dueDate: dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        project.tasks.push(task);
        console.log(`Tarea "${taskName}" agregada al proyecto "${project.name}".`);
        return task;
    }

    completeTask(projectId, taskId) {
        const project = this.getProject(projectId);
        if (!project) {
            console.log("Error: Proyecto no encontrado.");
            return false;
        }
        const task = project.tasks.find(task => task.id === taskId);
        if (!task) {
            console.log("Error: Tarea no encontrada.");
            return false;
        }
        task.completed = true;
        task.completedAt = new Date().toISOString();
        console.log(`Tarea "${task.name}" marcada como completada.`);
        return true;
    }

    getPendingTasks() {
        const allTasks = [];
        this.projects.forEach(project => {
            if (project.owner === this.currentUser?.username) {
                project.tasks.forEach(task => {
                    if (!task.completed) {
                        allTasks.push({
                            ...task,
                            projectName: project.name,
                            projectId: project.id
                        });
                    }
                });
            }
        });
        return allTasks;
    }

    // --- Métodos de Contratos Forward ---

    createForwardContract(assetType, amount, strikePrice, expirationDate, contractType = 'buy') {
        if (!this.currentUser) {
            console.log("Error: Debes iniciar sesión para crear un contrato forward.");
            return null;
        }
        const contract = {
            id: Date.now(),
            assetType: assetType,
            amount: amount,
            strikePrice: strikePrice,
            expirationDate: expirationDate,
            contractType: contractType,
            owner: this.currentUser.username,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        this.contracts.push(contract);
        console.log(`Contrato forward creado: ${contractType.toUpperCase()} ${amount} ${assetType} a $${strikePrice} USD, vence el ${expirationDate}`);
        return contract;
    }

    getContracts() {
        return this.contracts.filter(contract => contract.owner === this.currentUser?.username);
    }

    getContract(contractId) {
        return this.contracts.find(contract => contract.id === contractId);
    }

    executeContract(contractId) {
        const contract = this.getContract(contractId);
        if (!contract) {
            console.log("Error: Contrato no encontrado.");
            return false;
        }
        if (contract.owner !== this.currentUser?.username) {
            console.log("Error: Solo puedes ejecutar tus propios contratos.");
            return false;
        }
        if (contract.status !== 'active') {
            console.log("Error: El contrato ya no está activo.");
            return false;
        }

        contract.status = 'executed';
        contract.executedAt = new Date().toISOString();
        console.log(`Contrato forward ejecutado exitosamente.`);
        return true;
    }

    // --- Métodos de Utilidad ---

    getUserStats() {
        if (!this.currentUser) {
            return null;
        }
        const userProjects = this.projects.filter(project => project.owner === this.currentUser.username);
        const totalTasks = userProjects.reduce((total, project) => total + project.tasks.length, 0);
        const completedTasks = userProjects.reduce((total, project) => 
            total + project.tasks.filter(task => task.completed).length, 0
        );
        
        return {
            username: this.currentUser.username,
            totalProjects: userProjects.length,
            totalTasks: totalTasks,
            completedTasks: completedTasks,
            pendingTasks: totalTasks - completedTasks
        };
    }
}

// Crear instancia global para usar en el frontend
window.bitForward = new BitForward();