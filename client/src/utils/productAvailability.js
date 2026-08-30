export const productAvailable=product=>product?.available!==undefined?Boolean(product.available):Number(product?.stock)>0;
export const productOrderLimit=product=>productAvailable(product)?Math.max(1,Math.min(Number(product?.orderLimit||product?.stock||10),10)):0;
export const withoutExactStock=product=>{
  const {stock,...safe}=product||{};
  const available=productAvailable(product);
  return {...safe,available,orderLimit:available?10:0};
};
