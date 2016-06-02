/**
 * The following components are responsible for rendering the emotions page,
 * i.e. the page where the user picks their desired emotion.
 */

import React, { Component } from 'react'
import { Link } from 'react-router'
import request from 'superagent'
import AddRating from './modals/AddRating'

/**
 * Emotion is the component that renders a single emotion inside the grid. It is
 * a stateless component, as such it was written using the shorthand notation.
 *
 * @TODO Add icon
 */

const Emotion = ({name}) => (
    <li data-col="1-3">
        <div className="emotions-entry">
            <Link to={`/${name}/`}>{name}</Link>
        </div>
    </li>
)

/**
 * Emotions is the container Component for the emotion picker. It is responsible
 * for handling the state of the emotions and fetching them. It controls the
 * rendering of the emotions page.
 */

export default class Emotions extends Component {
    constructor(props) {
        super(props)

        this.state = {
            emotions: []
        }

        this.getEmotions()
    }

    /**
     * getEmotions() gets a list of all emotions from the database and updates
     * the state once the data was fetched.
     */

    getEmotions() {
        request.get('/api/emotions/')
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (!err) {
                    this.setState({
                        emotions: res.body.emotions
                    })
                }
            })
    }

    render() {
        document.title = 'What the fuck should I watch tonight?!'

        return (
            <main className="wrapper">
                <header className="emotions-header">
                    <h1 className="emotions-title">Show me movies that'll make me feel…</h1>
                </header>
                <div className="emotions-wrapper">
                    <ul data-grid className="emotions-list unstyled-list">
                        {this.state.emotions.map(e => <Emotion name={e.emotion} key={e.id} />)}
                    </ul>
                </div>
                <footer className="emotions-footer">
                    <a data-button onClick={() => this.addRating.openModal()}>…or rate a movie?</a>
                </footer>
                <AddRating ref={a => this.addRating = a} />
            </main>
        )
    }
}
