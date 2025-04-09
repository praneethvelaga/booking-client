import {loadUserState, saveUserState, clearUserState} from './loadUserState';

export const authReducer = (state = loadUserState(), action) => {
    const newState = Object.assign({}, state);
    const {type, payload} = {...action};
    switch (type) {
        case 'SET_USER':
            saveUserState(payload);
            newState.token = payload.token;
            newState.user = payload.user;
            break;
        case 'LOGOUT_USER':
            clearUserState();
            newState.token = '';
            newState.user = {};
            break;
        default:
            break;
    }
    return newState;
};