/**
 * Step I: The createElement Function
 * Step II: The render Function
 * Step III: Concurrent Mode
 * Step IV: Fibers
 * Step V: Render and Commit Phases
 * Step VI: Reconciliation
 * Step VII: Function Components
 * Step VIII: Hooks
 */

// const element = <h1 title="foo">Hello</h1>

// const element = {
//     type: 'h1',
//     props: {
//         title: 'foo',
//         children: 'Hello'
//     }
// }

const element = React.createElement(
    'h1',
    { title: "foo"},
    'Hello'
)


const container = document.getElementById("root")


// ReactDOM.render(element, container)

const node = document.createElement(element.type)
node['title'] = element.props.title

const text = document.createTextNode("")
text['nodeValue'] = element.props.children



