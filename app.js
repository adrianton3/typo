(() => {
    'use strict'

    const typosReduced = new Map([
        ['a', 's'],
        ['b', 'vn'],
        ['c', 'xv'],
        ['d', 'sf'],
        ['e', 'wr'],
        ['f', 'dg'],
        ['g', 'fh'],
        ['h', 'gj'],
        ['i', 'uo'],
        ['j', 'hk'],
        ['k', 'jl'],
        ['l', 'k'],
        ['m', 'n'],
        ['n', 'bm'],
        ['o', 'ip'],
        ['p', 'o'],
        ['q', 'w'],
        ['r', 'et'],
        ['s', 'ad'],
        ['t', 'ry'],
        ['u', 'yi'],
        ['v', 'cb'],
        ['w', 'qe'],
        ['x', 'zc'],
        ['y', 'tu'],
        ['z', 'x'],
    ])

    const typosExtended = new Map([
        ['a', 'sqwz'],
        ['b', 'vngh'],
        ['c', 'xvdf'],
        ['d', 'sfercx'],
        ['e', 'wrsd'],
        ['f', 'dgrtvc'],
        ['g', 'ftyhbv'],
        ['h', 'gyujnb'],
        ['i', 'ujko'],
        ['j', 'huikmn'],
        ['k', 'jiolm'],
        ['l', 'kop'],
        ['m', 'njk'],
        ['n', 'bhjm'],
        ['o', 'iklp'],
        ['p', 'ol'],
        ['q', 'wa'],
        ['r', 'etdf'],
        ['s', 'adwexz'],
        ['t', 'ryfg'],
        ['u', 'yihj'],
        ['v', 'cbfg'],
        ['w', 'qeas'],
        ['x', 'zcsd'],
        ['y', 'tugh'],
        ['z', 'xas'],
    ])

    function invertMap(map) {
        const inverse = new Map

        map.forEach((value, key) => {
            [...value].forEach((letter) => {
                if (inverse.has(letter)) {
                    inverse.get(letter).push(key)
                } else {
                    inverse.set(letter, [key])
                }
            })
        })

        return inverse
    }

    function getIndices (string, character) {
        const indices = []

        for (let index = 0; index < string.length; index++) {
            if (string[index] === character) {
                indices.push(index)
            }
        }

        return indices
    }

    function indexOfRandom (string, character) {
        const indices = getIndices(string, character)

        if (indices.length > 0) {
            return indices[Math.random() * string.length | 0]
        }

        return -1
    }

    function recode (word, letter, options) {
        if (word.length < 2) {
            return
        }

        if (word[0] === letter.toUpperCase()) {
            return word[0].toLowerCase() + word.slice(1)
        }

        const index = indexOfRandom(word, letter)

        if (index >= 0) {
            if (Math.random() < options.deleteChance) {
                return word.slice(0, index) + word.slice(index + 1)
            } else if (index === 0) {
                return word[1] + word[0] + word.slice(2)
            } else {
                return word.slice(0, index - 1) + word[index] + word[index - 1] + word.slice(index + 1)
            }
        } else if (options.typosInverse.has(letter)) {
            const candidates = options.typosInverse.get(letter)

            for (const candidate of candidates) {
                const index = indexOfRandom(word, candidate)

                if (index >= 0) {
                    return word.slice(0, index) + letter + word.slice(index + 1)
                }
            }
        }
    }

    function reassemble (carrier, message, options) {
        let i = 0
        const parts = []

        carrier.split(/\b/g).forEach((part) => {
            if (i >= message.length) {
                parts.push(part)
                return
            }

            const result = recode(part, message[i], options)

            if (
                result == null ||
                Math.random() < options.skipChance
            ) {
                parts.push(part)
            } else {
                i++
                parts.push(result)
            }
        })

        return {
            message: parts.join(''),
            complete: i >= message.length,
        }
    }

    function retry (triesMax, fun, isDone) {
        for (let i = 0; i < triesMax; i++) {
            const candidate = fun(i)

            if (isDone(candidate)) {
                return candidate
            }
        }
    }

    function everything (carrier, message) {
        const typosReducedInverse = invertMap(typosReduced)

        const options = {
            typosInverse: typosReducedInverse,
            deleteChance: .3,
            skipChance: 0.,
        }

        {
            const candidate = retry(
                30,
                (count) => reassemble(carrier, message, { ...options, skipChance: 1. / (count * .8 + 2) }),
                (result) => result.complete
            )

            if (candidate != null) {
                return candidate
            }
        }

        {
            const candidate = reassemble(carrier, message, options)

            if (candidate.complete) {
                return candidate
            }
        }

        const typosExtendedInverse = invertMap(typosExtended)

        {
            const candidate = retry(
                30,
                (count) => reassemble(carrier, message, { ...options, typosInverse: typosExtendedInverse, skipChance: 1. / (count * .8 + 2) }),
                (result) => result.complete
            )

            if (candidate != null) {
                return candidate
            }
        }

        {
            const candidate = reassemble(carrier, message, { ...options, typosInverse: typosExtendedInverse })

            if (candidate.complete) {
                return candidate
            }
        }
    }

    // Object.assign(window, {
    //     recode,
    //     reassemble,
    //     everything,
    // })

    {
        const elements = {
            carrier: document.getElementById('carrier'),
            message: document.getElementById('message'),
            output: document.getElementById('output'),
        }

        function run () {
            if (
                elements.carrier.value.length <= 0 ||
                elements.message.value.length <= 0
            ) {
                elements.output.value = ''
                elements.output.classList.remove('complete')
                elements.output.classList.remove('incomplete')
                return
            }

            const start = performance.now()
            const result = everything(elements.carrier.value, elements.message.value)
            console.log(performance.now() - start)

            if (result != null && result.complete) {
                elements.output.classList.add('complete')
                elements.output.classList.remove('incomplete')

                elements.output.value = result.message
            } else {
                elements.output.classList.remove('complete')
                elements.output.classList.add('incomplete')
            }
        }

        elements.carrier.addEventListener('keyup', run)
        elements.message.addEventListener('keyup', run)

        if (location.hash.length > 0) {
            const parts = location.hash.slice(1).split('~')

            elements.carrier.value = parts[0]
            if (parts.length > 1) {
                elements.message.value = parts[1]
            }
        }
    }
})()
