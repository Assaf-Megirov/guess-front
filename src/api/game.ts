const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_GAME_ROUTE = import.meta.env.VITE_API_GAME_ROUTE;
const URL = `${API_BASE_URL}/${API_GAME_ROUTE}`;

export const validateWord = async (word: string, letters: string) => {
    const response = await fetch(`${URL}/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({word, letters}),
    });
    if (!response.ok) {
        const error = await response.json();
        if(response.status === 400){
            return {success: false, reason: error.message};
        }
        throw new Error(`We had trouble connecting to the server, error: ${error.message}`);
    }
    try{
        return response.json();
    } catch (error) {
        throw new Error('We had trouble connecting to the server, error: ' + error + ' ' + await response.text());
    }
}

export const getNextTierCombos = async (letters: string) => {
    const response = await fetch(`${URL}/next-combos?letters=${encodeURIComponent(letters)}`, {
        method: 'GET',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to get next tier combos: ${response.statusText} | for data: ${JSON.stringify({letters})}`);
    }
    try {
        return response.json();
    } catch (error) {
        throw new Error('Invalid JSON response: ' + error + ' ' + await response.text());
    }
}