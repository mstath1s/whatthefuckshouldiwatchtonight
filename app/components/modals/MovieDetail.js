import React, { Component, PropTypes } from 'react'
import Alert from 'react-s-alert'
import Modal from 'react-modal'
import request from 'superagent'
import isEmpty from 'lodash/isempty'
import { PercentageEmotion } from '../emotions/Emotion'
import { handleRequest } from '../../utils'

/**
 * This component is responsible for showing detailed information about a single
 * movie inside a modal.
 */

class MovieDetail extends Component {
    static propTypes = {
        rateCallback: PropTypes.func.isRequired,
        emotion: PropTypes.string.isRequired
    }

    // React Modal expects styling to be passed as inline styles.

    static modalStyle = {
        overlay: {
            zIndex: 2
        },
        content: {
            top: '50%',
            left: '50%',
            border: 0,
            backgroundColor: '#2c3641',
            right: 'auto',
            bottom: 'auto',
            width: '50em',
            marginLeft: '-25em',
            height: '25em',
            marginTop: '-12.5em',
            padding: 0,
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.6)'
        }
    }

    constructor(props) {
        super(props)

        this.state = {
            isOpen: false,
            detail: {},
            totalRatings: 0
        }

        this.hasChanged = false

        this.openModal = this.openModal.bind(this)
        this.closeModal = this.closeModal.bind(this)
    }

    /**
     * Open the modal and fetch information about the selected movie.
     *
     * @param   {integer}  movieId  The ID of the movie to load information
     *                              about.
     *
     * @return  {void}
     */

    openModal(movieId) {
        this.movieRequest = request.get(`/api/movies/${movieId}/`)
            .set('Accept', 'application/json')
            .end((err, res) => handleRequest(err, res, res => {
                this.setState({
                    isOpen: true,
                    detail: res.body,
                    totalRatings: res.body.emotions.reduce((acc, el) => acc + +el.count, 0)
                })

                this.movieRequest = null
            }, () => {
                Alert.error('Could not retrieve information about the movie. Please try again.')
                this.movieRequest = null
            }))
    }

    /**
     * addRating() adds a new rating for the currently displayed movie with the
     * given emotionId. The modal is updated with the new percentages of
     * emotional matches.
     *
     * @param   {integer}  emotionId  The emotion to use for the rating.
     *
     * @return  {void}
     */

    addRating(emotionId) {
        request.post('/api/reviews/')
            .set('Content-Type', 'application/json')
            .send(`{ "movieId": ${this.state.detail.id}, "emotionId": ${emotionId} }`)
            .end((err, res) => handleRequest(err, res, res => {
                this.hasChanged = true

                // Update the count of the just selected emotion. The
                // totalRatings count is also updated so the percentages all
                // work correctly.

                const emotions = this.state.detail.emotions
                const count = emotions[emotions.indexOf(emotions.filter(e => e.id == emotionId)[0])].count
                emotions[emotions.indexOf(emotions.filter(e => e.id == emotionId)[0])].count = +count + 1

                this.setState({
                    detail: { ...this.state.detail, emotions },
                    totalRatings: this.state.totalRatings + 1
                })
            }, () => {
                Alert.error('Could not save your rating for the movie. Please try again.')
            }))
    }

    /**
     * Close the modal and clear information about the previously selected
     * movie. A rateCallback() function is called so other components are
     * informed about the changes to the movie's percentage of emotional
     * matches.
     *
     * @return  {void}
     */

    closeModal() {
        const { isOpen, detail, totalRatings } = this.state

        if (!isOpen) return

        this.props.rateCallback(
            detail.id,
            detail.emotions.filter(e => e.emotion == this.props.emotion)[0].count / +totalRatings,
            this.hasChanged
        )

        this.hasChanged = false

        this.setState({
            isOpen: false
        })

        // Only reset the state of the modal after the animation has finished.

        setTimeout(() => this.setState({
            detail: {},
            totalRatings: 0
        }), 250)
    }

    /**
     * Cancel all requests before the component is unmounted.
     *
     * @return  {void}
     */

    componentWillUnmount() {
        if (this.movieRequest) {
            this.movieRequest.abort()
            this.movieRequest = null
        }
    }

    render() {
        const { isOpen, detail } = this.state

        return (
            <Modal isOpen={isOpen}
                   style={MovieDetail.modalStyle}
                   onRequestClose={this.closeModal}
                   closeTimeoutMS={350}>
                <section data-grid="gutterless">
                    <div data-col="1-3"
                         className="detail-poster"
                         style={{ backgroundImage: detail.poster_path ? `url(https://image.tmdb.org/t/p/w396/${detail.poster_path})` : 'none'}}></div>
                    <div data-col="2-3"
                         className="detail-content">
                        <section className="detail-movie">
                            <h2 className="h3 detail-title">
                                <span className="highlighted">{detail.title}</span> ({detail.release_year})
                            </h2>
                            <p>{!isEmpty(detail.directors) && `by ${detail.directors.join(', ')} — `}{detail.runtime} mins</p>
                            <p className="detail-description">{detail.overview}</p>
                            {!isEmpty(detail.cast) && <p>Cast: {detail.cast.join(', ')}</p>}
                        </section>
                        <ul className="unstyled-list percentage-list">
                            {!isEmpty(detail.emotions) && detail.emotions.map(e => (
                                <PercentageEmotion key={e.id}
                                                   percentage={e.count / +totalRatings}
                                                   emotion={e.emotion}
                                                   id={e.id}
                                                   onClick={i => this.addRating(i)} />
                            ))}
                        </ul>
                    </div>
                </section>
            </Modal>
        )
    }
}

export default MovieDetail
