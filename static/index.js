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
        this.nodesDataView = null
        this.edgesDataView = null

        this.minInteractions = 0.05
        this.showSentiments = false

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
                    hover: primaryClr,
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
                    hover: {
                        border: primaryClr,
                        background: backgroundClr
                    },
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
            },
            interaction: {
                hover: true
            }
        };

        console.log(seed)

        this.rgbRLow = Number(styles.getPropertyValue('--rgb-rlow').trim())
        this.rgbRHigh = Number(styles.getPropertyValue('--rgb-rhigh').trim())
        this.rgbGLow = Number(styles.getPropertyValue('--rgb-glow').trim())
        this.rgbGHigh = Number(styles.getPropertyValue('--rgb-ghigh').trim())
        this.rgbBLow = Number(styles.getPropertyValue('--rgb-blow').trim())
        this.rgbBHigh = Number(styles.getPropertyValue('--rgb-bhigh').trim())
    }

    getClr = (sentiment_score) => {
        const fraction_from_low = 0.5 + Math.max(-0.5, Math.min(0.5, sentiment_score))
        
        return `rgb( \
            ${Math.round((this.rgbRHigh-this.rgbRLow)*fraction_from_low) + this.rgbRLow}, \
            ${Math.round((this.rgbGHigh-this.rgbGLow)*fraction_from_low) + this.rgbGLow}, \
            ${Math.round((this.rgbBHigh-this.rgbBLow)*fraction_from_low) + this.rgbBLow} \
        )`
    }

    createLabelEl = (num_interactions, sentiment_score = null, total = false) => {
        const labelDivEl = document.createElement('div')
        labelDivEl.innerHTML =  sentiment_score === null ? 
            `<p>${num_interactions}${total ? " total" : ""} interactions</p>` : 
            `<p>${num_interactions} interactions</p><p>Sentiment: ${sentiment_score.toFixed(2)}</p>`   
        return labelDivEl
    }

    loadData = async () => {
        const character_names_arr = await fetchJSON("static/character_names.json")
        const interactions_arr = await fetchJSON("static/interactions.json")
    
        const num_interactions_per_char = interactions_arr.map(arr => arr.reduce((sum, el) => el ? sum + el[1] : sum, 0))
        
        const nodesMaxInteractions = Array.from({length: character_names_arr.length}, () => [0, 0])

        const edgesArr = []
        for (let i = 0; i < character_names_arr.length - 1; i++) {
            for (let j = i+1; j < character_names_arr.length; j++) {
                const num_interactions = interactions_arr[i][j][1] 
    
                if (!num_interactions) continue
                
                const closeness_i = num_interactions_per_char[i]/num_interactions
                const closeness_j = num_interactions_per_char[j]/num_interactions
                const interaction_score = (closeness_i + closeness_j)**(1/3)

                const percentage_interaction_mean = 1/Math.sqrt(closeness_i*closeness_j) // determined by fraction of interactions between characters A and B to the geometric mean of the total interactions of A and total interactions of B 
                const sentiment = interactions_arr[i][j][0] + interactions_arr[j][i][0] 

                const edgeObj = {
                    from: i, 
                    to: j, 
                    value: num_interactions, // determines thickness
                    length: interaction_score*100, // determines edge length
                    weight: num_interactions,
                    percentage_interaction: percentage_interaction_mean,
                    sentiment: sentiment,
                    title: this.createLabelEl(num_interactions), // for tooltip
                    color: null
                }

                const edgeObjClr = {
                    ...edgeObj,
                    title: this.createLabelEl(num_interactions, sentiment),
                    color: this.getClr(sentiment)
                }

                edgesArr.push(edgeObj)
                edgesArr.push(edgeObjClr)

                nodesMaxInteractions[i][0] = Math.max(nodesMaxInteractions[i][0], num_interactions)
                nodesMaxInteractions[i][1] = Math.max(nodesMaxInteractions[i][1], percentage_interaction_mean)
                nodesMaxInteractions[j][0] = Math.max(nodesMaxInteractions[j][0], num_interactions)
                nodesMaxInteractions[j][1] = Math.max(nodesMaxInteractions[j][1], percentage_interaction_mean)

            }
        }

        const nodesArr = character_names_arr.map((name, idx) => ({
                id: idx, 
                label: name,
                title: this.createLabelEl(num_interactions_per_char[idx], null, true),
                maxNumInteractions: nodesMaxInteractions[idx][0],
                maxPercentageInteractions: nodesMaxInteractions[idx][1]
            }))

        const nodesDataSet = new vis.DataSet(nodesArr)
        const edgesDataSet = new vis.DataSet(edgesArr)

        this.nodesDataView = new vis.DataView(nodesDataSet, {
            filter: (node) => this.minInteractions < 1 ? node.maxPercentageInteractions >= this.minInteractions : node.maxNumInteractions >= this.minInteractions, 
            fields: ['id', 'label', 'title']
        })

        this.edgesDataView = new vis.DataView(edgesDataSet, {
            filter: (edge) =>  (this.showSentiments === Boolean(edge.color)) && (this.minInteractions < 1 ? edge.percentage_interaction >= this.minInteractions : edge.value >= this.minInteractions),
            fields: ['id', 'from', 'to', 'value', 'length', 'weight', 'title', 'color']
        })

        const data = {
            nodes: this.nodesDataView,
            edges: this.edgesDataView
        }

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
}

document.addEventListener('DOMContentLoaded', () => {
    const cnetwork = new CharacterNetwork();
    initGraph(cnetwork)
    
    const menuContainerEl = document.getElementById('menuContainer')

    document.getElementById('menuBtn').addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('open');
        menuContainerEl.classList.toggle('open')

    });

    const sentimentCheckboxEl = document.getElementById('sentiment_checkbox')
    sentimentCheckboxEl.addEventListener('change', () => {
        cnetwork.showSentiments = sentimentCheckboxEl.checked
        cnetwork.edgesDataView.refresh()
    })

    const sliderOptions = {
        min: [1, 0.002],
        max: [50, 0.10],
        step: [1, 0.002],
        value: [5, 0.05],
        title: [
            "Minimum number of interactions for edge to be shown",
            "Minimum percentage of interactions (geometric mean) for edge to be shown"
        ]
    }

    const percentageRadioEl = document.getElementById('percentage')
    const numericRadioEl = document.getElementById('numeric')
    const rangeSliderEl = document.getElementById('interactionsFilter')
    const valueDisplayEl = document.getElementById('filterValue')

    percentageRadioEl.addEventListener('change', () => {
        changeRangeSliderAttributes(rangeSliderEl, sliderOptions, valueDisplayEl, 1)
    })
    numericRadioEl.addEventListener('change', () => {
        changeRangeSliderAttributes(rangeSliderEl, sliderOptions, valueDisplayEl, 0)
    })

    rangeSliderEl.addEventListener('input', () => {
        const isPercentage = Number(percentageRadioEl.checked)

        valueDisplayEl.innerHTML = isPercentage ? `${(rangeSliderEl.value * 100).toFixed(1)}%`: rangeSliderEl.value
        sliderOptions.value[isPercentage] = rangeSliderEl.value
    }) 

    const submitBtnEl = document.getElementById('submitBtn')

    submitBtnEl.addEventListener('click', () => {
        cnetwork.minInteractions = rangeSliderEl.value
        cnetwork.edgesDataView.refresh()
        cnetwork.nodesDataView.refresh()
    })


    // Setting Defaults
    sentimentCheckboxEl.checked = false
    percentageRadioEl.checked = true
    changeRangeSliderAttributes(rangeSliderEl, sliderOptions, valueDisplayEl, 1)
});
