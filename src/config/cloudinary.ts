import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';

cloudinary.config({ 
    
    cloud_name: config.cloudinaryCloudName, 
    api_key: config.cloudinaryApiKey, 
    api_secret: config.cloudinarySecret // Click 'View API Keys' above to copy your API secret
});

export default cloudinary;