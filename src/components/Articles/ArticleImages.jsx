import React, { Component } from 'react'
import { Box, Container, Grid,
        Typography, Icon, Tooltip, Divider } from '@material-ui/core'

import axios from 'axios'
import { Link } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'

import { backendUrl, defineErrorMsg } from '../../config/backend'

import SmallImgDefault from '../../assets/img_not_found_512x512.png'
import MediumImgDefault from '../../assets/img_not_found_768.png'
import BigImgDefault from '../../assets/img_not_found_1080.png'

import CustomButton from '../Button.jsx'

import Image from 'material-ui-image'

import './css/ArticleImages.css'

class ArticleImages extends Component {
    
    state = {
        smallImgDirectory: '',
        mediumImg: null,
        mediumImgDirectory: '',
        bigImg: null,
        bigImgDirectory: '',

        sending: false,
    }

    toogleSending(){
        this.setState({sending: !this.state.sending})
    }

    sendFile = async (photo, path) => {

        /* Realiza o envio da imagem */

        /* 
            - Ocorre a verificação do tipo de imagem a ser enviada
            - Após verifica se há imagem a enviar
            - Com isso é criado um form data e também e configurado o header 
            necessario para o êxito do envio da imagem
            - Assim a imagem é enviada
        */
        
        const img = photo.target.files[0]
        
        //Verifica o tipo de imagem, aceitando apenas bigImg ou smallImg
        if(path !== 'bigImg' && path !== 'smallImg' && path !== 'mediumImg') 
        return toast.error((<div className="centerVertical"><Icon className="marginRight">clear</Icon>Ocorreu um erro desconhecido, se persistir reporte [Code: 10]</div>), {autoClose: 2000, closeOnClick: true}) 
        
        //Verifica se há imagem
        if(!img) 
        return toast.info((<div className="centerVertical"><Icon className="marginRight">warning</Icon>Selecione uma imagem</div>), {autoClose: 2000, closeOnClick: true}) 

        //Obtém se o ID do artigo e a imagem selecionada
        const id = this.props.article._id

        /*  Configuração do formData para persistencia da imagem
            Adicionando a imagem e também o id do artigo
            OBS: O campo 'chave' da imagem deverá ser igual ao Atributo
            'name' da tag <img>
        */
        const formData = new FormData()
        await formData.append(path, img) 
        await formData.append('idArticle', id)
        
        /*  Definição do campo de diretorio 
            (Este campo é referido da URL pública que será pego a
            imagem do backend para visualização) a ser persistido a imagem
            e o método de requisição. [post para smallImg e put para bigImg]
        */

        let directory = ''
        let method = ''

        switch(path){
            case 'smallImg':{
                directory = 'smallImgDirectory'
                method = 'post'
                break
            }
            case 'mediumImg':{
                directory = 'mediumImgDirectory'
                method = 'patch'
                break
            }
            case 'bigImg':{
                directory = 'bigImgDirectory'
                method = 'put'
                break
            }
            default: {
                directory = null
            }
        }

        /*  Define a altura da imagem em pixels pelo tipo do path
            [1080p para bigImg e 512p para smallImg]
        */
        const size = path === 'smallImg' ? 512 : 1080
        
        /*
            Configuração do header para a requisição. 
            (Pré requisito do multer[API backend para envio de arquivos])
        */
        const config = {
            headers: {
                'content-type': 'multipart/form-data' 
            }
        }
        
        const url = `${backendUrl}/articles/img/${id}?path=${path}&size=${size}`
        await this.toogleSending()
        await axios[method](url, formData, config).then( res => {
            toast.success((<div className="centerVertical"><Icon className="marginRight">done</Icon>Operação realizada com sucesso</div>), {autoClose: 2000, closeOnClick: true})
            /*  Definição do diretório para visualização da imagem após exito
                do envio e remoção da imagem do campo Input
            */
            this.setState({
                [directory]: `${backendUrl}/${res.data}`,
            })

        }).catch( async error => {
            const msg = await defineErrorMsg(error)
            toast.error((<div className="centerVertical"><Icon className="marginRight">clear</Icon>{msg}</div>))
        })

        this.toogleSending()
    }

    removeFile = (state, path) => event => {

        /* Realiza a remoção da imagem */

        /*  Verificação para caso de ocorrer tentativa de remoção de imagem
            inexistente
        */
        if(!state.smallImgDirectory && path === 'smallImg') return
        if(!state.bigImgDirectory && path === 'bigImg') return
        
        const option = window.confirm('Tem certeza que deseja remover esta imagem?')

        if(option){
            const id = this.props.article._id
            const url = `${backendUrl}/articles/img/${id}?path=${path}`
            axios.delete(url).then(() => {
                toast.success((<div className="centerVertical"><Icon className="marginRight">done</Icon>Operação realizada com sucesso</div>), {autoClose: 2000, closeOnClick: true})
                /*  Definição do campo de diretorio 
                    (Este campo é referido da URL pública que será pego a
                    imagem do backend para visualização) e retirada de visualização 
                    da imagem. 
                */
                const directory = path === 'smallImg' ? 'smallImgDirectory' : 'bigImgDirectory'
                this.setState({
                    [directory]: ''
                })
            }).catch(async error => {
                const msg = await defineErrorMsg(error)
                toast.error((<div className="centerVertical"><Icon className="marginRight">clear</Icon>{msg}</div>))
            })
        }
    }

    changeFile = (img, path) => {
        /*  Altera a imagem a cada confirmação de escolha dentro 
            do input tipo file 
        */
        if(path !== 'smallImg' && path !== 'bigImg' && path !== 'mediumImg') 
        return toast.error((<div className="centerVertical"><Icon className="marginRight">clear</Icon>Ocorreu um erro ao selecionar a imagem, se persistir reporte</div>), {autoClose: 2000, closeOnClick: true})
        
        this.setState({[path]: img.target.files[0]})
    }

    async componentDidMount(){
        const article = this.props.article
        if(!article) return toast.error((<div className="centerVertical"><Icon className="marginRight">clear</Icon>Ocorreu um erro ao recuperar as informações do artigo, se persistir reporte</div>), {autoClose: 2000, closeOnClick: true})
        
        /* Disponibiliza as imagens definidas do artigo caso estejam definidas */
        await this.setState({
            smallImgDirectory: article.smallImg ? `${backendUrl}/${article.smallImg}` : '',
            mediumImgDirectory: article.mediumImg ? `${backendUrl}/${article.mediumImg}` : '',
            bigImgDirectory: article.bigImg ? `${backendUrl}/${article.bigImg}` : ''
        })

    }


    render() { 
        return ( 
            <Container>
                { this.props.article._id && <Container className="content">
                    <Box mb={3} mt={3} display="flex" flexDirection="column">
                        <Box display="flex" alignItems="center">
                            <Icon fontSize="large">image</Icon>
                            <Typography variant="h5" component="h2">
                                Imagens do artigo
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" component="small">
                                Defina as imagens deste artigo, <strong>para remover uma imagem desejada basta clicar em cima da opção desejada</strong>.
                            </Typography>
                        </Box>
                    </Box>
                    <ToastContainer />
                    <Grid item xs={12} className="bigImgSection">
                            <Grid item xs={12} sm={6} md={4}>
                                <Tooltip title={this.state.smallImgDirectory ? "Remover Imagem" : ""} placement="right-start">
                                    {/* <figure className={this.state.smallImgDirectory ? "img" : ""} onClick={this.removeFile(this.state, 'smallImg')}>
                                        <img src={this.state.smallImgDirectory ? this.state.smallImgDirectory : SmallImgDefault} alt="Logo do artigo" width="100%"></img>
                                    </figure> */}
                                    <Box width="100%">
                                        <Image
                                            imageStyle={this.state.smallImgDirectory ? {
                                                height: '100%',
                                            } : {
                                                borderRadius: '30px',
                                            }}
                                            className={this.state.smallImgDirectory ? "img" : ""}
                                            onClick={this.removeFile(this.state, 'smallImg')}
                                            src={this.state.smallImgDirectory ? this.state.smallImgDirectory : SmallImgDefault}
                                        />
                                        {/* <small className="imgDescription">Logo do artigo</small> */}
                                    </Box>
                                </Tooltip>
                            </Grid>
                            <Grid item xs={12} sm={6} md={8}>
                                <Box width="100%" mt={1}>
                                    <label className="fakeButton">
                                        <Icon>
                                            photo
                                        </Icon>
                                        {this.state.sending ?
                                            'Enviando...' : 'Alterar imagem'
                                        }
                                        <input type="file" name="smallImg" id="small_img_article"
                                            onChange={(photo) => this.sendFile(photo, 'smallImg')}
                                            className="profile_photo_input"
                                            />
                                    </label>
                                    {/* <Box className="formGroupWithSmallImg">
                                        <TextField type="file" className="inputImg" name="smallImg" id="small_img_article" helperText="Prefire imagens quadráticas e com resolução por volta de 256px" onChange={(file) => this.changeFile(file, 'smallImg')}/>
                                        <CustomBaseButton type="submit" class="success" icon="save" />
                                    </Box> */}
                                </Box>
                            </Grid>
                        </Grid>
                    <Divider />
                        <Grid item xs={12} className="mediumImg">
                            <Grid item xs={12}>
                                <Tooltip title={this.state.mediumImgDirectory ? "Remover Imagem" : ""} placement="right-start">
                                    <figure className={this.state.mediumImgDirectory ? "img" : ""} onClick={this.removeFile(this.state, 'mediumImg')}>
                                        <img src={this.state.mediumImgDirectory ? this.state.mediumImgDirectory : MediumImgDefault} alt="Logo do artigo" width="100%"></img>
                                        <figcaption className="imgDescription">Usado para artigos relacionados | Prefira imagens de resolução 1360 x 768</figcaption>
                                    </figure>
                                </Tooltip>
                            </Grid>
                            <Grid item xs={12}>
                                <Box width="100%" mt={1}>
                                    <label className="fakeButton">
                                        <Icon>
                                            photo
                                        </Icon>
                                        {this.state.sending ?
                                            'Enviando...' : 'Alterar imagem'
                                        }
                                        <input type="file" name="mediumImg" id="medium_img_article"
                                            onChange={(photo) => this.sendFile(photo, 'mediumImg')}
                                            className="profile_photo_input"
                                            />
                                    </label>
                                </Box>
                            </Grid>
                        </Grid>
                    <Divider />
                        <Grid item xs={12} className="bigImgSection">
                            <Grid item xs={12}>
                                <Tooltip title={this.state.bigImgDirectory ? "Remover Imagem" : ""} placement="right-start">
                                    <figure className={this.state.bigImgDirectory ? "img" : ""} onClick={this.removeFile(this.state, 'bigImg')}>
                                        <img src={this.state.bigImgDirectory ? this.state.bigImgDirectory : BigImgDefault} alt="Cabeçalho do artigo" width="100%"></img>
                                        <figcaption className="figCaption">Cabeçalho do artigo | Prefire imagens de resolução 1920 x 1080</figcaption>
                                    </figure>
                                </Tooltip>
                            </Grid>
                            <Grid item xs={12}>
                                <Box width="100%" mt={1}>
                                    <label className="fakeButton">
                                        <Icon>
                                            photo
                                        </Icon>
                                        {this.state.sending ?
                                            'Enviando...' : 'Alterar imagem'
                                        }
                                        <input type="file" name="bigImg" id="small_img_article"
                                            onChange={(photo) => this.sendFile(photo, 'bigImg')}
                                            className="profile_photo_input"
                                            />
                                    </label>
                                </Box>
                            </Grid>
                        </Grid>
                    <Grid item xs={12} className="footList formGroup">
                        <Link to="/articles" className="linkRouter linkButton"><CustomButton color="gray" text="Voltar" icon="exit_to_app" /></Link>
                    </Grid>
                </Container>}
                {!this.props.article._id && 
                    <Container>
                        <Grid item xs={12}>
                            <Box m={5} p={5} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                                <Typography variant="body1" component="p">
                                    Ops, infelizmente só é possível adicionar imagens a artigos ja cadastrados.
                                </Typography>
                                <Typography variant="body1" component="p">
                                    Caso esteja criando um, salve as alterações e depois volte aqui para adicioná-las.
                                </Typography>
                            </Box>
                        </Grid>
                    </Container>
                }
            </Container>
        );
    }
}

export default ArticleImages;