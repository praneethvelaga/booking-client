export const SET_USER = (payload) =>{
    return{
        type:'SET_USER',
        payload,
    };
};
export const LOGOUT_USER =()=>{
    return{
        type:'LOGOUT_USER',
    };
};