// App实例Fiber
function App() {
    const [num, updateNum] = useState(0)

    return <p onClick={() => updateNum(num => num + 1)}>{num}</p>
}