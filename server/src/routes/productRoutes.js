import {Router} from 'express';import {getProducts,getProduct} from '../controllers/productController.js';const r=Router();r.get('/',getProducts);r.get('/:id',getProduct);export default r;
