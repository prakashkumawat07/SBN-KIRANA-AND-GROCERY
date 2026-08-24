import {Router} from 'express';import {createMessage} from '../controllers/contactController.js';const r=Router();r.post('/',createMessage);export default r;
