#!/bin/bash

# Script para desplegar BitForward en GitHub Pages

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== BitForward GitHub Pages Deployment ===${NC}"
echo -e "${YELLOW}Este script ayudará a desplegar el proyecto en GitHub Pages${NC}"
echo ""

# Verificar si Git está instalado
if ! command -v git &> /dev/null
then
    echo -e "${RED}Error: Git no está instalado. Por favor instala Git para continuar.${NC}"
    exit 1
fi

# Verificar si estamos en el directorio correcto
if [ ! -f "index.html" ] || [ ! -d "assets" ] || [ ! -d "css" ] || [ ! -d "js" ]; then
    echo -e "${RED}Error: No estás en el directorio raíz del proyecto BitForward.${NC}"
    echo -e "${YELLOW}Por favor, navega al directorio que contiene index.html, assets/, css/ y js/${NC}"
    exit 1
fi

# Verificar si ya es un repositorio Git
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Inicializando repositorio Git...${NC}"
    git init
    echo -e "${GREEN}Repositorio Git inicializado.${NC}"
else
    echo -e "${GREEN}El repositorio Git ya está inicializado.${NC}"
fi

# Preguntar por el nombre de usuario de GitHub
echo -e "${YELLOW}Introduce tu nombre de usuario de GitHub:${NC}"
read github_username

if [ -z "$github_username" ]; then
    echo -e "${RED}No se proporcionó un nombre de usuario. Usando 'AsesorAFT' por defecto.${NC}"
    github_username="AsesorAFT"
fi

# Verificar si el origen remoto ya está configurado
if git remote -v | grep -q origin; then
    echo -e "${YELLOW}El origen remoto ya está configurado:${NC}"
    git remote -v
    
    echo -e "${YELLOW}¿Deseas cambiarlo? (s/n)${NC}"
    read change_remote
    
    if [ "$change_remote" = "s" ] || [ "$change_remote" = "S" ]; then
        echo -e "${YELLOW}Eliminando el origen remoto actual...${NC}"
        git remote remove origin
        
        echo -e "${YELLOW}Configurando nuevo origen remoto...${NC}"
        git remote add origin "https://github.com/$github_username/BitForward.git"
        echo -e "${GREEN}Origen remoto configurado a https://github.com/$github_username/BitForward.git${NC}"
    fi
else
    echo -e "${YELLOW}Configurando origen remoto...${NC}"
    git remote add origin "https://github.com/$github_username/BitForward.git"
    echo -e "${GREEN}Origen remoto configurado a https://github.com/$github_username/BitForward.git${NC}"
fi

# Añadir todos los archivos
echo -e "${YELLOW}Añadiendo archivos al repositorio...${NC}"
git add .

# Preguntar por un mensaje de commit
echo -e "${YELLOW}Introduce un mensaje de commit (o presiona Enter para usar mensaje predeterminado):${NC}"
read commit_message

if [ -z "$commit_message" ]; then
    commit_message="Actualización de BitForward - $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Hacer commit
echo -e "${YELLOW}Haciendo commit con mensaje: \"$commit_message\"${NC}"
git commit -m "$commit_message"

# Preguntar por la rama
echo -e "${YELLOW}Introduce el nombre de la rama (o presiona Enter para usar 'main'):${NC}"
read branch_name

if [ -z "$branch_name" ]; then
    branch_name="main"
fi

# Subir cambios
echo -e "${YELLOW}Subiendo cambios a la rama $branch_name...${NC}"
git push -u origin $branch_name

echo ""
echo -e "${GREEN}==================== IMPORTANTE ====================${NC}"
echo -e "${GREEN}Para completar la publicación en GitHub Pages:${NC}"
echo -e "${YELLOW}1. Ve a https://github.com/$github_username/BitForward/settings${NC}"
echo -e "${YELLOW}2. Navega a la sección 'GitHub Pages'${NC}"
echo -e "${YELLOW}3. En 'Source', selecciona la rama '$branch_name' y la carpeta raíz '/ (root)'${NC}"
echo -e "${YELLOW}4. Haz clic en 'Save'${NC}"
echo ""
echo -e "${GREEN}Una vez configurado, tu sitio estará disponible en:${NC}"
echo -e "${YELLOW}https://$github_username.github.io/BitForward/${NC}"
echo ""
echo -e "${GREEN}¡Gracias por usar BitForward!${NC}"
