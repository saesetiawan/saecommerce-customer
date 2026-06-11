import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';


export const UseGetStatusLogged = (url: string) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken") || Cookies.get("access_token");
        if(accessToken) {
            setIsLoggedIn(true)
        }
    }, [url]);
    return {
        isLoggedIn
    }
}