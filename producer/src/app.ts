import * as express from 'express'
import {Request, Response} from "express";
import * as cors from 'cors'
import {createConnection} from 'typeorm'
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

            const app = express()

            app.use(cors({ // frontend - react 3000, vue.js 8080, angular 4200
                origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
            }))

            app.use(express.json())

            // CRUD endpoint
            // GET http://localhost:8000/api/songs
            app.get('/api/songs', async (req: Request, res: Response) => {
                const songs = await songRepository.find()
                res.json(songs)
            })

            // Create song
            // POST http://localhost:8000/api/songs [Body->JSON {title^2,artist^2}]
            app.post( '/api/songs', async (req: Request, res: Response)  => {
                const song = await songRepository.create(req.body);
                const result = await songRepository.save(song)
                channel.sendToQueue('song_created', Buffer.from(JSON.stringify(result)))
                return res.send(result)
            })

            // Read songs
            // GET http://localhost:8000/api/songs/1
            app.get('/api/songs/:id', async (req: Request, res: Response) => {
                const song = await songRepository.findOneById(req.params.id)
                return res.send(song)
            })

            // Update song
            // PUT http://localhost:8000/api/songs/1 [Body->JSON {title:new,artist:new}]
            app.put('/api/songs/:id', async (req: Request, res: Response) => {
                const song = await songRepository.findOneById(req.params.id) // get first song
                songRepository.merge(song, req.body) // merge song with req we send
                const result = await songRepository.save(song) // save song
                channel.sendToQueue('song_updated', Buffer.from(JSON.stringify(result)))
                return res.send(result) // data will be updated
            });

            // Delete song
            // DELETE http://localhost:8000/api/songs/1
            app.delete('/api/songs/:id', async (req: Request, res: Response) => {
                const result = await  songRepository.delete(req.params.id)
                channel.sendToQueue('song_deleted', Buffer.from(req.params.id))
                return res.send(result)
            })

            // use calling from other app (consumer will send http req to this endpoint)
            // // POST http://localhost:8000/api/songs/1/like
            // app.post('/api/songs/:id/like', async (req: Request, res: Response) => {
            //     const song = await songRepository.findOneById(req.params.id) // get first song
            //     song.likes++
            //     const result = await songRepository.save(song) // save song
            //     return res.send(result)
            // })

            console.log('Listening to port: 8000')
            // node use for communication with frontend
            app.listen(8000)
            process.on('beforeExit', () => {
                console.log('closing')
                connection.close()
            })
        })
    })
})
