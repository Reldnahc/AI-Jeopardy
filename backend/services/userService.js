import {supabase} from "../config/database.js";

export async function getIdFromUsername(username) {

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username') // Correct syntax for selecting multiple fields
        .eq('username', username.toLowerCase())
        .single(); // Fetch a single matching row

    if (error) {
        console.error('Error fetching ID:', error.message);
        return null; // Return null or throw an error, based on your use case
    }
    return data?.id; // Access the `id` field from `data` and handle potential null values
}

export async function getColorFromPlayerName(username) {

    const id = await getIdFromUsername(username);

    const { data, error } = await supabase
        .from('user_profiles')
        .select('color, text_color')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching color:', error.message);
        return null; // Return null or throw an error, based on your use case
    }
    console.log(data);

    return data;
}