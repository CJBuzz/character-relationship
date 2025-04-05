const fetchJSON = async (url) => {
    try {
        const res = await fetch(url)
         
        if (!res.ok) throw new Error('Fetch failed!')

        return await res.json()

    } catch(error) {
        console.error("Error fetching character_names.json", error)
        return null

    }
}

class CharacterNetwork {
    constructor() {
        this.nodesArr = null
        this.edgesArr = null

        const root = document.documentElement; 
        const styles = getComputedStyle(root); 
        const backgroundClr = styles.getPropertyValue('--color-background').trim()
        const primaryClr = styles.getPropertyValue('--color-primary').trim()
        const primaryClrDark = styles.getPropertyValue('--color-primarydark').trim()
        const secondaryClr = styles.getPropertyValue('--color-secondary').trim();

        const seed = Math.random()

        this.options = {
            height: `${Math.max(300, window.innerHeight-20)}px`,
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
                randomSeed: seed, // 0.7216629891520017
            }
        };

        console.log(seed)
    }

    loadData = async () => {
        const character_names_arr = await fetchJSON("static/character_names.json")
        const interactions_arr = await fetchJSON("static/interactions.json")
    
        const num_interactions_per_char = interactions_arr.map(arr => arr.reduce((sum, el) => el ? sum + el[1] : sum, 0))
    
        this.nodesArr = character_names_arr.map((name, idx) => ({id: idx, label: name}))
    
        this.edgesArr = []
        for (let i = 0; i < character_names_arr.length - 1; i++) {
            for (let j = i+1; j < character_names_arr.length; j++) {
                const num_interactions = interactions_arr[i][j][1] 
    
                if (!num_interactions) continue
                
                const closeness_i = num_interactions_per_char[i]/num_interactions
                const closeness_j = num_interactions_per_char[j]/num_interactions
                const interaction_score = (closeness_i + closeness_j)**(1/3)
                
                this.edgesArr.push({
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
    }

    filterNodesEdges = (
        min_interactions, // Can be a decimal between 0 and 1 or an integer. If it is an integer, it represents the minimum number of interactions the edge must have to be shown. If it is between 0 and 1, it represents the minimum percentage that the interaction must comprise of when compared to the total number of interactions in the more prominent character for the edge to be shown
    ) => {
        const shownNodes = new Set()
        const filteredEdges = this.edgesArr.filter((edge) => {
            if (min_interactions < 1) {
                if (edge.min_percentage < min_interactions) return false
            }
            else if (edge.weight < min_interactions) return false
            shownNodes.add(edge.from)
            shownNodes.add(edge.to)
            return true
        }) 

        const edgesDataset = new vis.DataSet(filteredEdges)

        const filteredNodes = this.nodesArr.filter((node) => shownNodes.has(node.id))
        const nodesDataset = new vis.DataSet(filteredNodes)

        return [nodesDataset, edgesDataset]
    }

    displayGraph = (
        nodesDataset,
        edgesDataset
    ) => {
        const data = {nodes: nodesDataset, edges: edgesDataset}

        if (this.graph) {
            this.graph.setData(data)
        } else {
            const container = document.getElementById('graph');
            this.graph = new vis.Network(container, data, this.options)
            window.addEventListener('resize', () => {
                const height = `${Math.max(300, window.innerHeight-20)}px`;
                const width = `100%`;
    
                this.graph.setSize(width, height);
                this.graph.redraw();
            });
        }
    }
}


const changeRangeSliderAttributes = (rangeSliderEl, sliderOptions, valueDisplayEl, isPercentage) => {
    rangeSliderEl.min = sliderOptions.min[isPercentage]
    rangeSliderEl.max = sliderOptions.max[isPercentage]
    rangeSliderEl.step = sliderOptions.step[isPercentage]
    rangeSliderEl.title = sliderOptions.title[isPercentage]
    rangeSliderEl.value = sliderOptions.value[isPercentage]
    valueDisplayEl.innerHTML = isPercentage ? `${(rangeSliderEl.value * 100).toFixed(1)}%`: rangeSliderEl.value
}

const initGraph = async (cnetwork) => {
    await cnetwork.loadData()
    const [nodesDataset, edgesDataset] = cnetwork.filterNodesEdges(5)
    cnetwork.displayGraph(nodesDataset, edgesDataset)
}

document.addEventListener('DOMContentLoaded', () => {
    const cnetwork = new CharacterNetwork();
    initGraph(cnetwork)
    
    const menuContainerEl = document.getElementById('menuContainer')

    document.getElementById('menuBtn').addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('open');
        menuContainerEl.classList.toggle('open')

    });

    const sliderOptions = {
        min: [1, 0.002],
        max: [50, 0.10],
        step: [1, 0.002],
        value: [5, 0.01],
        title: [
            "Minimum number of interactions for edge to be shown",
            "Minimum percentage of interactions (with respect to more prominent character) for edge to be shown"
        ]
    }

    const percentageRadioEl = document.getElementById('percentage')
    const numericRadioEl = document.getElementById('numeric')
    const rangeSliderEl = document.getElementById('interactionsFilter')
    const valueDisplayEl = document.getElementById('filterValue')

    percentageRadioEl.addEventListener('change', (e) => {
        changeRangeSliderAttributes(rangeSliderEl, sliderOptions, valueDisplayEl, 1)
    })
    numericRadioEl.addEventListener('change', (e) => {
        changeRangeSliderAttributes(rangeSliderEl, sliderOptions, valueDisplayEl, 0)
    })

    rangeSliderEl.addEventListener('input', (e) => {
        const isPercentage = Number(percentageRadioEl.checked)

        valueDisplayEl.innerHTML = isPercentage ? `${(e.currentTarget.value * 100).toFixed(1)}%`: e.currentTarget.value
        sliderOptions.value[isPercentage] = e.currentTarget.value
    }) 

    const submitBtnEl = document.getElementById('submitBtn')

    submitBtnEl.addEventListener('click', () => {
        const [nodesDataset, edgesDataset] = cnetwork.filterNodesEdges(rangeSliderEl.value)
        cnetwork.displayGraph(nodesDataset, edgesDataset)
    })

    numericRadioEl.checked = true
    changeRangeSliderAttributes(rangeSliderEl, sliderOptions, valueDisplayEl, 0)
});
