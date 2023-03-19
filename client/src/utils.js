import { roomUrlValidRegex } from "./constants";
export const getRoomFromURLObject = (urlObject) => {
    const roomMatch = urlObject.pathname?.match(roomUrlValidRegex); // ^\/room\/([^\/?&#]+)\/?
    if (roomMatch && roomMatch.length > 1) {
        return roomMatch[1];
    }
    return null;
};
