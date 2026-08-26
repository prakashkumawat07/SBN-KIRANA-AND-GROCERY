export default async function handler(req,res){
  const token=process.env.VERCEL_OIDC_TOKEN;
  if(!token)return res.status(200).json({status:'ok',oidcAvailable:false,vercelApiStatus:null});
  try{
    const response=await fetch('https://api.vercel.com/v9/projects/prj_nukl02danpIyWYRlpO9YnoFa4jix?teamId=team_w30bp1eExqMqJMz7smWuN4kV',{
      headers:{Authorization:`Bearer ${token}`}
    });
    return res.status(200).json({status:'ok',oidcAvailable:true,vercelApiStatus:response.status});
  }catch{
    return res.status(200).json({status:'ok',oidcAvailable:true,vercelApiStatus:0});
  }
}
