// Incluir a função que está em keyCodeFromKey.jsx
export function keyCodeFromKey(key) {
    // Se já é um número, retornar diretamente
    if (typeof key === 'number') {
        return key;
    }
    
    // Se for string, processar normalmente
    if (typeof key === 'string') {
        switch(key) {
            case 'LEFT_ARROW': return 37;
            case 'UP_ARROW': return 38;
            case 'RIGHT_ARROW': return 39;
            case 'DOWN_ARROW': return 40;
            case 'A': return 65;
            case 'D': return 68;
            case 'W': return 87;
            case 'S': return 83;
            case 'F': return 70;
            case 'G': return 71;
            case 'K': return 75;
            case 'L': return 76;
            default: return key.charCodeAt(0);
        }
    }
    
    // Caso não seja nem string nem número, retornar um valor padrão
    console.error("keyCodeFromKey recebeu tipo inválido:", typeof key, key);
    return 0;
}