// --- Funciones para renderizar (mostrar) el contenido ---

/**
 * Renderiza la lista de proyectos en el contenedor correspondiente.
 */
function renderProjects() {
  const projectsContainer = document.getElementById('projects-container');
  // Limpiamos el contenido actual (el mensaje "Cargando...")
  projectsContainer.innerHTML = '';

  // Creamos y añadimos el HTML para cada proyecto
  mockProjects.forEach(project => {
    // Usamos `` (template literals) para crear el HTML más fácilmente
    const projectElement = `
      <div class="project-card">
        <span class="status status-${project.status.toLowerCase()}">${project.status}</span>
        <h4>${project.name}</h4>
        <p>${project.description}</p>
      </div>
    `;
    projectsContainer.innerHTML += projectElement;
  });
}

/**
 * Renderiza la lista de tareas en el contenedor correspondiente.
 */
function renderTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    tasksContainer.innerHTML = '';

    mockTasks.forEach(task => {
        const taskElement = `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} disabled>
                <label>${task.text}</label>
            </div>
        `;
        tasksContainer.innerHTML += taskElement;
    });
}


// --- Punto de entrada de la aplicación ---

// document.addEventListener('DOMContentLoaded', ...) asegura que el script se ejecuta
// solo después de que todo el HTML de la página se ha cargado.
document.addEventListener('DOMContentLoaded', () => {
  console.log('BitForward UI iniciada.');
  
  // Llamamos a nuestras funciones para mostrar los datos
  renderProjects();
  renderTasks();
});