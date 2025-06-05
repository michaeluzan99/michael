import '../styles/Base.css';
import '../styles/Files.css';
export default function Files(){
  const files=[{id:1,name:"syllabus.pdf",url:"#"}];
  return(<section className="page-wrapper">
    <h1 className="page-title">My Files</h1>
    <ul className="space-y-2">
      {files.map(f=><li key={f.id} className="file-item">
        <a href={f.url} className="file-link">{f.name}</a>
        <button className="text-red-500">Delete</button>
      </li>)}
    </ul>
  </section>)
}
