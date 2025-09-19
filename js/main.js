// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("¡Interfaz de BitForward cargada y lista!");

    // Referencias a elementos del DOM
    const projectList = document.querySelector('.project-list');
    const taskList = document.querySelector('.task-list');
    const contractsContainer = document.querySelector('.contracts-container');
    const navLinks = document.querySelectorAll('nav a');

    // Estado de la aplicación
    let currentView = 'projects';

    // Función para mostrar el estado de autenticación
    function updateAuthStatus() {
        const header = document.querySelector('header');
        const existingAuthSection = header.querySelector('.auth-section');
        
        if (existingAuthSection) {
            existingAuthSection.remove();
        }

        const authSection = document.createElement('div');
        authSection.className = 'auth-section';
        
        if (window.bitForward.currentUser) {
            authSection.innerHTML = `
                <span>Bienvenido, ${window.bitForward.currentUser.username}</span>
                <button id="logout-btn" class="btn btn-secondary">Cerrar Sesión</button>
            `;
        } else {
            authSection.innerHTML = `
                <button id="login-btn" class="btn btn-primary">Iniciar Sesión</button>
            `;
        }
        
        header.appendChild(authSection);
        
        // Agregar event listeners
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', showLoginForm);
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.bitForward.logout();
                updateAuthStatus();
                renderProjects();
                renderTasks();
                renderContracts();
            });
        }
    }

    // Función para mostrar formulario de login
    function showLoginForm() {
        const username = prompt('Ingresa tu nombre de usuario:');
        const password = prompt('Ingresa tu contraseña:');
        
        if (username && password) {
            if (window.bitForward.login(username, password)) {
                updateAuthStatus();
                renderProjects();
                renderTasks();
                renderContracts();
                showNotification('¡Bienvenido! Has iniciado sesión exitosamente.', 'success');
            } else {
                showNotification('Credenciales incorrectas. Intenta nuevamente.', 'error');
            }
        }
    }

    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Función para renderizar proyectos
    function renderProjects() {
        if (!window.bitForward.currentUser) {
            projectList.innerHTML = '<p>Inicia sesión para ver tus proyectos.</p>';
            return;
        }

        const projects = window.bitForward.getProjects();
        const userProjects = projects.filter(project => project.owner === window.bitForward.currentUser.username);

        if (userProjects.length === 0) {
            projectList.innerHTML = `
                <p>No tienes proyectos aún.</p>
                <button id="create-project-btn" class="btn btn-primary">Crear Nuevo Proyecto</button>
            `;
        } else {
            projectList.innerHTML = `
                <div class="projects-header">
                    <h3>Tus Proyectos (${userProjects.length})</h3>
                    <button id="create-project-btn" class="btn btn-primary">Nuevo Proyecto</button>
                </div>
                <div class="projects-grid">
                    ${userProjects.map(project => `
                        <div class="project-card" data-project-id="${project.id}">
                            <h4>${project.name}</h4>
                            <p>${project.description}</p>
                            <div class="project-stats">
                                <span>${project.tasks.length} tareas</span>
                                <span>${project.tasks.filter(t => t.completed).length} completadas</span>
                            </div>
                            <div class="project-actions">
                                <button class="btn-small add-task-btn" data-project-id="${project.id}">Agregar Tarea</button>
                                <button class="btn-small btn-danger delete-project-btn" data-project-id="${project.id}">Eliminar</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Agregar event listeners
        const createProjectBtn = document.getElementById('create-project-btn');
        if (createProjectBtn) {
            createProjectBtn.addEventListener('click', showCreateProjectForm);
        }

        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = parseInt(e.target.dataset.projectId);
                showCreateTaskForm(projectId);
            });
        });

        document.querySelectorAll('.delete-project-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = parseInt(e.target.dataset.projectId);
                if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
                    if (window.bitForward.deleteProject(projectId)) {
                        renderProjects();
                        renderTasks();
                        showNotification('Proyecto eliminado exitosamente.', 'success');
                    }
                }
            });
        });
    }

    // Función para renderizar tareas
    function renderTasks() {
        if (!window.bitForward.currentUser) {
            taskList.innerHTML = '<p>Inicia sesión para ver tus tareas.</p>';
            return;
        }

        const pendingTasks = window.bitForward.getPendingTasks();

        if (pendingTasks.length === 0) {
            taskList.innerHTML = '<p>¡Excelente! No tienes tareas pendientes.</p>';
        } else {
            taskList.innerHTML = `
                <div class="tasks-header">
                    <h3>Tareas Pendientes (${pendingTasks.length})</h3>
                </div>
                <div class="tasks-list">
                    ${pendingTasks.map(task => `
                        <div class="task-item" data-task-id="${task.id}" data-project-id="${task.projectId}">
                            <div class="task-content">
                                <h5>${task.name}</h5>
                                <p>${task.description}</p>
                                <small>Proyecto: ${task.projectName}</small>
                                ${task.dueDate ? `<small class="due-date">Vence: ${new Date(task.dueDate).toLocaleDateString()}</small>` : ''}
                            </div>
                            <button class="btn-small btn-success complete-task-btn" 
                                    data-task-id="${task.id}" 
                                    data-project-id="${task.projectId}">
                                Completar
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Agregar event listeners para completar tareas
        document.querySelectorAll('.complete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.dataset.taskId);
                const projectId = parseInt(e.target.dataset.projectId);
                
                if (window.bitForward.completeTask(projectId, taskId)) {
                    renderProjects();
                    renderTasks();
                    showNotification('¡Tarea completada!', 'success');
                }
            });
        });
    }

    // Función para mostrar formulario de creación de proyecto
    function showCreateProjectForm() {
        const name = prompt('Nombre del proyecto:');
        const description = prompt('Descripción del proyecto:');
        
        if (name && description) {
            const project = window.bitForward.createProject(name, description);
            if (project) {
                renderProjects();
                showNotification('Proyecto creado exitosamente.', 'success');
            }
        }
    }

    // Función para renderizar contratos
    function renderContracts() {
        if (!window.bitForward.currentUser) {
            contractsContainer.innerHTML = '<p>Inicia sesión para ver tus contratos forward.</p>';
            return;
        }

        const contracts = window.bitForward.getContracts();

        if (contracts.length === 0) {
            contractsContainer.innerHTML = `
                <p>No tienes contratos forward aún.</p>
                <button id="create-contract-btn" class="btn btn-primary">Crear Nuevo Contrato Forward</button>
            `;
        } else {
            contractsContainer.innerHTML = `
                <div class="contracts-header">
                    <h3>Tus Contratos Forward (${contracts.length})</h3>
                    <button id="create-contract-btn" class="btn btn-primary">Nuevo Contrato</button>
                </div>
                <div class="contracts-grid">
                    ${contracts.map(contract => `
                        <div class="contract-card" data-contract-id="${contract.id}">
                            <div class="contract-header">
                                <h4>${contract.contractType.toUpperCase()} ${contract.amount} ${contract.assetType}</h4>
                                <span class="contract-status status-${contract.status}">${contract.status}</span>
                            </div>
                            <div class="contract-details">
                                <p><strong>Precio:</strong> $${contract.strikePrice} USD</p>
                                <p><strong>Vencimiento:</strong> ${new Date(contract.expirationDate).toLocaleDateString()}</p>
                                <p><strong>Creado:</strong> ${new Date(contract.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div class="contract-actions">
                                ${contract.status === 'active' ? 
                                    `<button class="btn-small btn-success execute-contract-btn" data-contract-id="${contract.id}">Ejecutar Contrato</button>` : 
                                    '<span class="executed-label">Ejecutado</span>'
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Agregar event listeners
        const createContractBtn = document.getElementById('create-contract-btn');
        if (createContractBtn) {
            createContractBtn.addEventListener('click', showCreateContractForm);
        }

        document.querySelectorAll('.execute-contract-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contractId = parseInt(e.target.dataset.contractId);
                if (confirm('¿Estás seguro de que quieres ejecutar este contrato?')) {
                    if (window.bitForward.executeContract(contractId)) {
                        renderContracts();
                        showNotification('Contrato ejecutado exitosamente.', 'success');
                    }
                }
            });
        });
    }

    // Función para mostrar formulario de creación de contrato
    function showCreateContractForm() {
        const assetType = prompt('Tipo de activo (ej: BTC, ETH):');
        const amount = prompt('Cantidad:');
        const strikePrice = prompt('Precio de ejercicio (USD):');
        const expirationDate = prompt('Fecha de vencimiento (YYYY-MM-DD):');
        const contractType = prompt('Tipo de contrato (buy/sell):') || 'buy';
        
        if (assetType && amount && strikePrice && expirationDate) {
            const contract = window.bitForward.createForwardContract(
                assetType.toUpperCase(), 
                parseFloat(amount), 
                parseFloat(strikePrice), 
                expirationDate, 
                contractType.toLowerCase()
            );
            if (contract) {
                renderContracts();
                showNotification('Contrato forward creado exitosamente.', 'success');
            }
        }
    }
    function showCreateTaskForm(projectId) {
        const name = prompt('Nombre de la tarea:');
        const description = prompt('Descripción de la tarea:');
        const dueDate = prompt('Fecha límite (YYYY-MM-DD) - opcional:');
        
        if (name && description) {
            const task = window.bitForward.addTask(projectId, name, description, dueDate || null);
            if (task) {
                renderProjects();
                renderTasks();
                showNotification('Tarea agregada exitosamente.', 'success');
            }
        }
    }

    // Navegación entre secciones
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.textContent.toLowerCase();
            
            // Actualizar navegación activa
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            
            // Mostrar/ocultar secciones
            document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
            
            if (section === 'proyectos') {
                document.getElementById('projects').style.display = 'block';
                currentView = 'projects';
            } else if (section === 'tareas') {
                document.getElementById('tasks').style.display = 'block';
                currentView = 'tasks';
            } else if (section.includes('contratos')) {
                document.getElementById('contracts').style.display = 'block';
                currentView = 'contracts';
            } else if (section === 'equipo') {
                // Sección de equipo - por implementar
                showNotification('Sección de equipo próximamente disponible.', 'info');
            }
        });
    });

    // Inicialización
    updateAuthStatus();
    renderProjects();
    renderTasks();
    renderContracts();
    
    // Establecer la vista inicial
    document.getElementById('projects').style.display = 'block';
    document.getElementById('tasks').style.display = 'block';
});