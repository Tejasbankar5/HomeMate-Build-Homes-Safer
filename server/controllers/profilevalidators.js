const validateProfileData = (data) => {
    const errors = [];
    
    if (!data.full_name || data.full_name.trim().length < 2) {
      errors.push('Full name is required and must be at least 2 characters');
    }
    
    if (!data.address || data.address.trim().length < 5) {
      errors.push('Valid address is required');
    }
    
    if (!data.services_offered) {
      errors.push('At least one service must be provided');
    }
    
    return errors;
  };
  
  module.exports = { validateProfileData };