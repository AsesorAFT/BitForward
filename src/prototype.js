// Prototipo de BitForward
// Fecha: 2025-09-19

class BitForward {
    constructor() {
        this.projects = [];
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
        console.log(`Proyecto \