// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("¡Interfaz de BitForward cargada y lista!");

    // Aquí conectaremos la lógica de prototype.js con el DOM.
    // Por ejemplo, podríamos empezar a renderizar los proyectos y tareas.
    
    const projectList = document.querySelector('.project-list');
    projectList.innerHTML = '<p>La interfaz se ha conectado con el JavaScript. ¡Pronto verás tus proyectos aquí!</p>';
});