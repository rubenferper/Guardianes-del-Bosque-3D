# Guardianes del Bosque 3D

Aplicación WebGL desarrollada con **Three.js**. Incluye un personaje humano 3D con modelo GLB y clips de animación, bosque con vegetación procedural, cámara orbital, iluminación HDRI opcional, niebla, objetos con colisión y controles por teclado.

## Archivos
- `index.html`: estructura, HUD, instrucciones y pie de página.
- `style.css`: diseño adaptable.
- `script.js`: escena Three.js, personaje, animaciones, físicas sencillas y controles.
- `favicon.svg`: icono de pestaña.

## Requisitos
Se necesita conexión a Internet para cargar Three.js desde jsDelivr. El personaje humano se carga desde el modelo GLB público Soldier de los ejemplos oficiales de Three.js. El proyecto necesita conexión a Internet para cargar Three.js, el modelo GLB y el HDRI opcional. Si el modelo GLB no responde, se muestra un personaje alternativo generado con geometrías. El piso y la vegetación se generan proceduralmente; no se requieren texturas JPG locales.

## Ejecutar localmente
No abras `index.html` directamente con doble clic porque el navegador puede bloquear los módulos. Desde la carpeta del proyecto ejecuta:

### Opción Python
```bash
python -m http.server 8000
```
Abre `http://localhost:8000`.

### Opción VS Code
Instala la extensión **Live Server**, haz clic derecho en `index.html` y selecciona **Open with Live Server**.

## Controles
| Tecla | Acción |
|---|---|
| W A S D | Desplazar al personaje |
| 1 | Secuencia de caminar |
| 2 | Secuencia de correr |
| 3 | Secuencia de bailar |
| Espacio | Saltar |
| Q | Giro de 90° a la izquierda |
| E | Giro de 90° a la derecha |
| Ratón | Orbitar/acercar/alejar cámara |
| Esc | Pausar/reanudar |

## Funcionalidades implementadas
1. Personaje humano 3D cargado desde GLB, con animaciones de caminar/correr y movimiento de baile procedural complementario.
2. Piso con textura procedural y cielo envolvente procedural y HDRI de bosque opcional para reflejos e iluminación ambiental.
3. Tres secuencias continuas: caminar, correr y bailar; salto independiente.
4. Movimiento por teclado y giro de 90°.
5. Cámara orbital con ratón.
6. Iluminación hemisférica, luz direccional tipo sol y faroles puntuales.
7. Niebla gris clara que aumenta visualmente con la distancia.
8. Más de cinco objetos 3D: rocas, tronco, pelota, árboles y límites. Colisiones aproximadas; la pelota recibe impulso al patearla.
9. Pie de página con datos del equipo e instrucciones.
10. Título de pestaña y favicon.

> Nota técnica: las colisiones son aproximadas mediante radios circulares en el plano XZ; no es un motor de física rígida completo. Para una simulación avanzada se puede integrar Rapier o cannon-es.

## Publicar en GitHub Pages
1. Crea un repositorio **público** en GitHub.
2. Copia estos archivos a tu carpeta local.
3. En Git Bash, dentro de la carpeta:
```bash
git init
git add .
git commit -m "Practica integradora: escena 3D con Three.js"
git branch -M main
git remote add origin https://github.com/USUARIO/NOMBRE-REPOSITORIO.git
git push -u origin main
```
4. En GitHub entra a **Settings → Pages**.
5. En **Build and deployment**, elige **Deploy from a branch**.
6. Selecciona `main` y `/ (root)`, guarda.
7. Espera a que GitHub Pages publique y abre la URL que aparece en esa sección.

Si el repositorio ya tiene un remoto configurado, no repitas `git remote add origin`; verifica con `git remote -v`.
