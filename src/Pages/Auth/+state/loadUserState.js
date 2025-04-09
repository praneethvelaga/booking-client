export const loadUserState = () => {
    try {
        const serializedState = localStorage.getItem("auth");
        console.log(serializedState)
        if (serializedState === null) {
            return {};
        }
        return JSON.parse(serializedState);
    } catch (err) {
        return {};
    }
};

export const saveUserState = state => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem("auth", serializedState);
    } catch (err) {
        console.log(err);
    }
};

export const clearUserState=()=>{
    try{
        localStorage.removeItem("auth");
    }catch(err){
        console.log(err);
    }
}