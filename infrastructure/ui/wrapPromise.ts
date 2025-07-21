/**
 * Envuelve una promesa para hacerla compatible con el mecanismo de Suspense.
 * Crea un "recurso" que puede ser leído de forma síncrona por un componente.
 * @param promise La promesa que se quiere gestionar (ej. una llamada a fetch).
 * @returns Una función "lectora" que el componente llamará.
 */
export function createSuspenseResource<T>(promise: Promise<T>): () => T {
    // --- PASO 1: Definir las variables de estado ---
    // 'status' rastrea el estado actual de la promesa.
    // Inicia como 'pending' (pendiente).
    let status: 'pending' | 'success' | 'error' = 'pending';

    // 'result' almacenará el dato final si la promesa tiene éxito,
    // o el error si es rechazada.
    let result: T | any;

    // --- PASO 2: Iniciar la promesa inmediatamente ---
    // Envolvemos la promesa original en un 'suspender'. Este es el objeto
    // que "lanzaremos" para que Suspense lo atrape.
    const suspender = promise.then(
        (resolvedValue) => {
            // Éxito: La promesa se resolvió correctamente.
            status = 'success';
            result = resolvedValue;
        },
        (error) => {
            // Error: La promesa fue rechazada.
            status = 'error';
            result = error;
        }
    );

    // --- PASO 3: Devolver la función "lectora" ---
    // Esta es la función que el componente realmente ejecutará.
    return () => {
        // Comprobamos el estado CADA VEZ que se llama a esta función.
        switch (status) {
            case 'pending':
                // Si aún estamos esperando, lanzamos el 'suspender'.
                // ¡Esta es la magia! Suspense lo atrapará, mostrará el fallback
                // y esperará a que el 'suspender' se complete.
                throw suspender;

            case 'error':
                // Si la promesa falló, lanzamos el error.
                // Esto permite que un <ErrorBoundary> superior lo atrape.
                throw result;

            case 'success':
                // Si la promesa ya se completó, simplemente devolvemos el resultado.
                // El componente renderizará normalmente con este dato.
                return result;
        }
    };
}
