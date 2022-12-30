import * as express from 'express'
import {Request, Response} from "express";
import * as cors from 'cors'
import {createConnection} from "typeorm";
import {Song} from "./entity/song";
import * as amqp from 'amqplib/callback_api';

createConnection().then(db => {

    const songRepository = db.getRepository(Song);

    amqp.connect('amqps://fyolxvxs:1ta7xZRksWLfVZ_nUbxvRj4eo0lynv0C@armadillo.rmq.cloudamqp.com/fyolxvxs', (error0, connection) => {
        if (error0) {
            throw error0
        }

        connection.createChannel((error1, channel) => {
            if (error1) {
                throw error1
            }

            channel.assertQueue('song_created', {durable: false})
            channel.assertQueue('song_updated', {durable: false})
            channel.assertQueue('song_deleted', {durable: false})


            const app = express()

            app.use(cors({ // frontend - react 3000, vue.js 8080, angular 4200
                origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
            }))

            app.use(express.json())

            // Create
            channel.consume('song_created', async (msg) => {
                const eventSong: Song = JSON.parse(msg.content.toString())
                const song = new Song()
                song.producer_id = parseInt(eventSong.id)
                song.title = eventSong.title
                song.artist = eventSong.artist
                // song.likes = eventSong.likes
                await songRepository.save(song)
                console.log('song created')
            }, {noAck: true})

            // Update
            channel.consume('song_updated', async (msg) => {
                const eventSong: Song = JSON.parse(msg.content.toString())
                const song = await songRepository.findOneBy({producer_id: parseInt(eventSong.id)})
                songRepository.merge(song, {
                    title: eventSong.title,
                    artist: eventSong.artist,
                    // likes: eventSong.likes
                })
                await songRepository.save(song)
                console.log('song updated')
            }, {noAck: true})

            // Delete
            channel.consume('song_deleted', async (msg) =>{
                const producer_id = parseInt(msg.content.toString())
                await songRepository.delete({producer_id})
                console.log('song deleted')
            }, {noAck: true})

            app.get('/api/songs', async (req: Request, res: Response) => {
                const songs = await songRepository.find()
                return res.send(songs)
            })


            // app.post('/api/songs/:id/like', async (req: Request, res: Response) => {
            //     const song = await songRepository.findOneById(req.params.id)
            //     await axios.post(`http://localhost:8000/api/songs/${song.producer_id}/like`, {})
            //     song.likes++
            //     await  songRepository.save(song)
            //     return res.send(song)
            // });

            console.log('Listening to port: 8001')
            // node use for communication with frontend
            app.listen(8001)
            process.on('beforeExit', () => {
                console.log('closing')
                connection.close()
            })
        })
    })
})
