export async function getItemName(itemId: number, language: string): Promise<string> {
    const response = await fetch(`https://xivapi.com/item/` + itemId);
        let jsonResponse = await response.json(); 

        switch (language) {
            case 'fr':
                return jsonResponse.Name_fr;
            case 'de':
                return jsonResponse.Name_de;
            case 'ja':
                return jsonResponse.Name_ja;
            default:
                return jsonResponse.Name;
        }
}