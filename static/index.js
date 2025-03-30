const fetchJSON = async (url) => {
    try {
        const res = await fetch(url)
         
        if (!res.ok) throw new Error('Fetch failed!')

        return await res.json()

    } catch(error) {
        console.error("Error fetching main_characters.json", error)
        return null

    }
}

const loadData = async () => {
    const main_characters_arr = await fetchJSON("static/main_characters.json")
    const interactions_arr = await fetchJSON("static/interactions.json")

    const num_interactions_per_char = interactions_arr.map(arr => arr.reduce((sum, el) => el ? sum + el[1] : sum, 0))

    const nodes_arr = main_characters_arr.map((name, idx) => ({id: idx, label: name}))

    edges_arr = []
    for (let i = 0; i < main_characters_arr.length - 1; i++) {
        for (let j = i+1; j < main_characters_arr.length; j++) {
            const num_interactions = interactions_arr[i][j][1] 

            if (!num_interactions) continue
            
            const closeness_i = num_interactions_per_char[i]/num_interactions
            const closeness_j = num_interactions_per_char[j]/num_interactions
            const interaction_score = (closeness_i + closeness_j)**(1/3)
            
            edges_arr.push({
                from: i, 
                to: j, 
                value: num_interactions, // determines thickness
                length: interaction_score*100, // determines edge length
                weight: num_interactions,
                min_percentage: Math.min(1/closeness_i, 1/closeness_j),
                sentiment: interactions_arr[i][j][0] + interactions_arr[j][i][0] // determines color 
            })
        }
    }

    return [nodes_arr, edges_arr]
}

const displayGraph = (
    nodes_arr,  // Nodes array
    edges_arr,  // Edges array
    min_interactions, // Can be a decimal between 0 and 1 or an integer. If it is an integer, it represents the minimum number of interactions the edge must have to be shown. If it is between 0 and 1, it represents the minimum percentage that the interaction must comprise of when compared to the total number of interactions in the more prominent character for the edge to be shown
    sentiment
) => {
    const shownNodes = new Set()
    const filteredEdges = edges_arr.filter((edge) => {
        if (min_interactions < 1) {
            if (edge.min_percentage < min_interactions) return false
        }
        else if (edge.weight < min_interactions) return false
        shownNodes.add(edge.from)
        shownNodes.add(edge.to)
        return true
    }) 

    const edges = new vis.DataSet(filteredEdges)

    const filteredNodes = nodes_arr.filter((node) => shownNodes.has(node.id))
    const nodes = new vis.DataSet(filteredNodes)

    const root = document.documentElement; 
    const styles = getComputedStyle(root); 
    const backgroundClr = styles.getPropertyValue('--color-background').trim()
    const primaryClr = styles.getPropertyValue('--color-primary').trim()
    const primaryClrDark = styles.getPropertyValue('--color-primarydark').trim()
    const secondaryClr = styles.getPropertyValue('--color-secondary').trim();

    const seed = Math.random()

    const options = {
        height: `${window.innerHeight-20}px`,
        edges: {
            smooth: {
                type: 'continuous',
                forceDirection: 'none', 
            },
            color: {
                color: primaryClrDark,
                highlight: secondaryClr
            }
        },
        nodes: {
            borderWidth: 2,
            borderWidthSelected: 4,
            shape: 'box',
            shapeProperties: {
                borderRadius: 100
            },
            margin: 8,
            color: {
                border: primaryClr,
                background: backgroundClr,
                highlight: {
                    border: secondaryClr,
                    background: backgroundClr
                }
            },
            font: {
                color: secondaryClr
            }
        },
        physics: {
            enabled: true,
            solver: 'repulsion',
            repulsion: {
                centralGravity: 0.1,
                nodeDistance: 300
            },
            // solver: 'barnesHut',
            // barnesHut: {
            // gravitationalConstant: -50,
            // centralGravity: 0.3,
            // springConstant: 0.04,
            // damping: 0.09,
            // avoidOverlap: 0.5
            // }
        },
        layout: {
            randomSeed: seed,
        },
        
    };

    console.log(seed)

    const container = document.getElementById('graph');
    const data = { nodes: nodes, edges: edges };
    const graph = new vis.Network(container, data, options);
}

const init = async() => {
    const [nodes_arr, edges_arr] = await loadData()
    displayGraph(nodes_arr, edges_arr, 0.01, null)
}

init()

