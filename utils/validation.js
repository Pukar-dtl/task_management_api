const validateRegistration = (data)=>{
    const errors = [];

    if(!data.fullName || data.fullName.length<5){
        errors.push('Full name must be at least 5 characters long');
    }
    if(!data.email || data.email.length<10 || !data.email.includes('@')){
        errors.push('Email is invalid');
    }
    if(!data.password || data.password.length<6){
        errors.push('Password must be at least 6 characters long')
    }
     return {
        error: errors.length > 0 ? { details: errors.map(e => ({ message: e })) } : null
    };
}

const validateLogin = (data)=>{
    const errors = [];

    if(!data.email|| !data.email.includes('@')){
        errors.push("Invalid email")
    }
    if(!data.password){
        errors.push("Password required")
    }
    return {
        error: errors.length > 0 ? { details: errors.map(e => ({ message: e })) } : null
    };
}

const validateTask=(data)=>{
    const error = [];

    if(!data.title || data.title.length<3){
        error.push('Tittle must be more than 2 characters long');
    }
    if(!data.priority|| !['Low','Medium','High'].includes(data.priority)){
        error.push('priority must be Low,Medium or High');
    }
    return {
        error: error.length > 0 ? { details: error.map(e => ({ message: e })) } : null
    };
}

module.exports = {
    validateRegistration,
    validateTask,
    validateLogin
}