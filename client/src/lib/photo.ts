// Prototype image-card preparation; avatar uses this before its own crop.
export async function preparePhoto(file:File):Promise<File>{
 if(file.size>20*1024*1024)throw Error('Choose a photo smaller than 20 MB.')
 if(!file.type.startsWith('image/'))throw Error('Choose an image.')
 const url=URL.createObjectURL(file)
 try{
  const image=new Image()
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('This photo could not be opened.'));image.src=url})
  const ratio=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas')
  canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio))
  canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height)
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('This photo could not be opened or saved. Try another one.')),'image/jpeg',.88))
  return new File([blob],'photo.jpg',{type:'image/jpeg'})
 }finally{URL.revokeObjectURL(url)}
}
