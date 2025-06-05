import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import "../styles/tasks.css";

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import {
  DragDropContext,
  Droppable,
  Draggable
} from "react-beautiful-dnd";

const statuses = ["to do", "in-progress", "done"];

export default function Tasks() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(u => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("owner", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    });
    return () => unsubscribe();
  }, [user]);

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, "tasks"), {
        text: newTaskText.trim(),
        owner: user.uid,
        status: "to do",
        createdAt: serverTimestamp(),
        completed: false,
      });
      setNewTaskText("");
    } catch (err) {
      setError("Failed to add task: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTask(taskId) {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (err) {
      alert("Failed to delete task: " + err.message);
    }
  }

  async function toggleComplete(task) {
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        completed: !task.completed,
        status: !task.completed ? "done" : "todo",
      });
    } catch (err) {
      alert("Failed to update task: " + err.message);
    }
  }

  async function onDragEnd(result) {
    if (!result.destination) return;

    const { draggableId, destination } = result;

    const newStatus = destination.droppableId;

    try {
      await updateDoc(doc(db, "tasks", draggableId), { status: newStatus });
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  }

  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status);
    return acc;
  }, {});

  if (!user) return <p>Please log in to see your tasks.</p>;

  return (
    <section className="page-wrapper p-6">
      <h1 className="text-2xl font-bold mb-4">Your Tasks</h1>

      <form onSubmit={handleAddTask} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="New task description"
          className="input-field flex-grow"
          disabled={loading}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Adding..." : "Add Task"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6">
          {statuses.map(status => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="bg-white p-4 rounded shadow flex-1 min-h-[300px]"
                >
                  <h2 className="font-semibold capitalize mb-2">{status.replace("-", " ")}</h2>
                  {tasksByStatus[status].map((task, index) => (
                    <Draggable
                      draggableId={task.id}
                      index={index}
                      key={task.id}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 rounded mb-2 flex items-center justify-between cursor-move
                            ${snapshot.isDragging ? "bg-blue-100" : "bg-gray-100"}`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleComplete(task)}
                              aria-label={`Mark task "${task.text}" as completed`}
                            />
                            <span className={task.completed ? "line-through text-gray-500" : ""}>
                              {task.text}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            aria-label={`Delete task "${task.text}"`}
                            className="text-red-600 font-bold text-xl"
                            type="button"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </section>
  );
}
