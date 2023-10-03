const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Task = require('../models/tasks')
const User = require('../models/users')
const multer = require('multer')
const sharp = require('sharp')

router.post('/user', async (req, res) => {
   
    try{
        const user = new User(req.body)
        const token = await user.generateAuthToken()

      await user.save()
      res.status(201).send({user, token})
    }
    catch(e){
      res.status(400).send(e)
    }
    
})

router.post('/user/login', async(req, res) => {
try{
    const user = await User.findByCreds(req.body.email, req.body.password)
    const token = await user.generateAuthToken()

    res.send({user, token})
}
catch(e){
    res.status(400).send()
    console.log(e)
}
})

router.post('/user/logout', auth, async(req, res) => {
    try{
         req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
         })

         await req.user.save()

         res.send()
    } catch(e){
         res.status(500).send()
    }
})

router.post('/user/logoutAll', auth, async(req, res) => {
    try{
         req.user.tokens = []
         await req.user.save()
         res.send()

    } catch (e){
        res.status(500).send()
    }
})

router.get('/user/me', auth, async(req, res) => {

        res.send(req.user)
})



router.patch('/user/me', auth , async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {

    const user = req.user
     

      if (!user) {
          return res.status(404).send()
      }
      updates.forEach((update) => user[update] = req.body[update])
     
      await user.save()
      res.send(user)
  } catch (e) {
      res.status(400).send(e)
  }
})

router.delete('/user/me', auth, async(req, res) => {
  try{
      const User = req.user
      await User.deleteOne()
      await Task.deleteMany({ "owner" : User._id })
      res.send(req.user)
       
  }
  catch(e) {
       res.status(500).send(e)
       console.log(e)
  }
})

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limit:{
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Only jpg, jpeg or png extensions are allowed'))
        }
        cb(undefined, true)
    }
})

router.post('/user/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width:250 , height:250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})


router.delete('/user/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/user/:id/avatar', async(req, res) => {
    const user = await User.findById(req.params.id)
    try{
          if (!user || !user.avatar) {
            throw new Error()
          }

          res.set('Content-Type', 'image/png')
          res.send(user.avatar)
    } catch (e){
        res.status(404).send()
    }
})


module.exports = router