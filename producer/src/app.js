"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var cors = require("cors");
var typeorm_1 = require("typeorm");
var song_1 = require("./entity/song");
var amqp = require("amqplib/callback_api");
(0, typeorm_1.createConnection)().then(function (db) {
    var songRepository = db.getRepository(song_1.Song);
    amqp.connect('amqps://fyolxvxs:1ta7xZRksWLfVZ_nUbxvRj4eo0lynv0C@armadillo.rmq.cloudamqp.com/fyolxvxs', function (error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }
            var app = express();
            app.use(cors({
                origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
            }));
            app.use(express.json());
            // CRUD endpoint
            // GET http://localhost:8000/api/songs
            app.get('/api/songs', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var songs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, songRepository.find()];
                        case 1:
                            songs = _a.sent();
                            res.json(songs);
                            return [2 /*return*/];
                    }
                });
            }); });
            // Create song
            // POST http://localhost:8000/api/songs [Body->JSON {title^2,artist^2}]
            app.post('/api/songs', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var song, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, songRepository.create(req.body)];
                        case 1:
                            song = _a.sent();
                            return [4 /*yield*/, songRepository.save(song)];
                        case 2:
                            result = _a.sent();
                            channel.sendToQueue('song_created', Buffer.from(JSON.stringify(result)));
                            return [2 /*return*/, res.send(result)];
                    }
                });
            }); });
            // Read songs
            // GET http://localhost:8000/api/songs/1
            app.get('/api/songs/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var song;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, songRepository.findOneById(req.params.id)];
                        case 1:
                            song = _a.sent();
                            return [2 /*return*/, res.send(song)];
                    }
                });
            }); });
            // Update song
            // PUT http://localhost:8000/api/songs/1 [Body->JSON {title:new,artist:new}]
            app.put('/api/songs/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var song, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, songRepository.findOneById(req.params.id)]; // get first song
                        case 1:
                            song = _a.sent() // get first song
                            ;
                            songRepository.merge(song, req.body); // merge song with req we send
                            return [4 /*yield*/, songRepository.save(song)]; // save song
                        case 2:
                            result = _a.sent() // save song
                            ;
                            channel.sendToQueue('song_updated', Buffer.from(JSON.stringify(result)));
                            return [2 /*return*/, res.send(result)]; // data will be updated
                    }
                });
            }); });
            // Delete song
            // DELETE http://localhost:8000/api/songs/1
            app.delete('/api/songs/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, songRepository.delete(req.params.id)];
                        case 1:
                            result = _a.sent();
                            channel.sendToQueue('song_deleted', Buffer.from(req.params.id));
                            return [2 /*return*/, res.send(result)];
                    }
                });
            }); });
            // use calling from other app (consumer will send http req to this endpoint)
            // // POST http://localhost:8000/api/songs/1/like
            // app.post('/api/songs/:id/like', async (req: Request, res: Response) => {
            //     const song = await songRepository.findOneById(req.params.id) // get first song
            //     song.likes++
            //     const result = await songRepository.save(song) // save song
            //     return res.send(result)
            // })
            console.log('Listening to port: 8000');
            // node use for communication with frontend
            app.listen(8000);
            process.on('beforeExit', function () {
                console.log('closing');
                connection.close();
            });
        });
    });
});
