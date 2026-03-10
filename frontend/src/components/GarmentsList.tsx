import React from "react"

interface Props{
  onShirtChange:(tex:string)=>void
  onJacketChange:(tex:string|null)=>void
  onColorChange:(color:string)=>void
}

const shirts=[
 {name:"Blue Shirt",tex:"/assets/blue-shirt.png"},
 {name:"Green Shirt",tex:"/assets/green-shirt.png"},
 {name:"Red Shirt",tex:"/assets/red-shirt.png"}
]

const jackets=[
 {name:"Black Jacket",tex:"/assets/black-jacket.png"},
 {name:"None",tex:null}
]

const colors=[
 "#ffffff",
 "#ff0000",
 "#00aaff",
 "#00aa55",
 "#000000"
]

const GarmentsList:React.FC<Props> = ({
  onShirtChange,
  onJacketChange,
  onColorChange
}) => {

  return (
    <div style={{width:250}}>

      <h3>Shirts</h3>
      {shirts.map(s=>(
        <div
          key={s.name}
          onClick={()=>onShirtChange(s.tex)}
          style={{cursor:"pointer"}}
        >
          {s.name}
        </div>
      ))}

      <h3>Jackets</h3>
      {jackets.map(j=>(
        <div
          key={j.name}
          onClick={()=>onJacketChange(j.tex)}
          style={{cursor:"pointer"}}
        >
          {j.name}
        </div>
      ))}

      <h3>Color</h3>
      {colors.map(c=>(
        <button
          key={c}
          style={{
            background:c,
            width:30,
            height:30,
            margin:5
          }}
          onClick={()=>onColorChange(c)}
        />
      ))}

    </div>
  )
}

export default GarmentsList