import React, { Component } from 'react'
import { Grid, Box, Table, TableBody, TableCell,
    TableFooter, TableHead, TablePagination, TableRow,
    Container, Paper, Icon, DialogTitle, DialogActions,
    DialogContent, DialogContentText, Dialog, TextField} from '@material-ui/core'

import axios from 'axios'
import { backendUrl } from '../../config/backend'

import Searching from '../../assets/searching.gif'
import ErrorBlock from '../ErrorBlock.jsx'
import StatsBlock from '../StatsBlock.jsx'
import CustomChip from '../Chip.jsx'
import CustomIconButton from '../IconButton.jsx'
import CustomButton from '../Button.jsx'

import { OPTIONS_LIMIT, DEFAULT_LIMIT, LIMIT_LABEL, DISPLAYED_ROWS } from '../../config/dataProperties'
import { toast } from 'react-toastify'
// import { displayFullDate } from '../config/masks'

import './css/ArticleStats.css'

const INITIAL_COMMENT = {
    _id: '',
    userName: '',
    userEmail: '',
    comment: '',
    readed: false,
    confirmed: false,
    article: null
}

class ArticleStats extends Component {
    state = { 
        loading: false,
        countViews: 0,
        countComments: 0,
        comments: [],
        countLikes: 0,
        error: false,

        limitComments: DEFAULT_LIMIT,
        pageComments: 1,

        comment: INITIAL_COMMENT,
        dialogAnswer: false,
        answer: '',
        sendingAnswer: false,
    }

    toogleLoading(){
        this.setState({loading: !this.state.loading})
    }

    changePage = async (event, page) => {
        /* Realiza a alternação de páginas da tabela de registros */

        await this.setState({
            pageComments: ++page
        })
        
        //this.searchUsers()
    }

    openComment(comment){
        if(!comment.readed){
            this.readComment()
        }
        this.setState({dialogAnswer: true, comment})
    }

    readComment(comment){
        const readed = {
            _id: comment._id,
            readed: true
        }
    
        const url = `${backendUrl}/comments`
    
        axios.patch(url, readed)
    }

    closeAnswerDialog(){
        this.setState({dialogAnswer: false, answer: '', comment: INITIAL_COMMENT})
    }

    toogleSendingAnswer(){
        this.setState({sendingAnswer: !this.state.sendingAnswer})
    }

    async sendAnswer(){
        const url = `${backendUrl}/comments`

        const body = {
            ...this.state.comment,
            answer: this.state.answer
        }

        await this.toogleSendingAnswer()

        await axios.post(url, body).then(res => {
            toast.success((<div className="centerVertical"><Icon className="marginRight">done</Icon><span>{res.data}</span></div>), {autoClose: 3000, closeOnClick: true})
            this.closeAnswerDialog()
        }).catch(error => {
            const msg = error.response.data || 'Ocorreu um erro desconhecido, se persistir reporte'

            toast.error((<div className="centerVertical"><Icon className="marginRight">clear</Icon>{msg}</div>), {autoClose: 3000, closeOnClick: true})
        })

        this.toogleSendingAnswer()
    }

    async getStats(){
        try {
            const articleId = this.props.article._id
            if(!articleId) return this.setState({error: true})

            await this.toogleLoading()
            const url = `${backendUrl}/articles/stats/${articleId}`
            await axios(url).then( res => {
                this.setState({
                    countViews: res.data.views.count,
                    countComments: res.data.comments.count,
                    comments: res.data.comments.comments,
                    countLikes: res.data.likes.count,
                    error: false
                })
            })

            this.toogleLoading()
        } catch (error) {
            this.setState({error: true})
        }
    }

    componentDidMount(){
        this.getStats()
    }

    render() { 
        return ( 
            <Grid item xs={12}>
                { this.state.loading &&
                    <Box display="flex" alignItems="center" flexDirection="column" m={5} p={5}>
                        <Box display="flex" justifyContent="center" alignItems="center" mb={1}>
                            <img src={Searching} alt="Carregando artigo"/>
                        </Box>
                        <h4>Carregando estatísticas, por favor aguarde...</h4>
                    </Box>
                }
                { !this.state.loading && !this.state.error &&
                    <Grid item xs={12}>
                        <Box pl={5} pr={5}>
                            <Box display="flex" alignItems="center" width="100%">
                                <Box mr={1}>
                                    <Icon>show_chart</Icon>
                                </Box>
                                <Box>
                                    <h4>Força do artigo</h4>
                                </Box>
                            </Box>
                        </Box>
                        <Box p={5}>
                            <Grid item xs={12} className="stats-blocks">
                                <Grid item xs={12} md={4}>
                                    <StatsBlock icon="touch_app" title="Visualizações" loadingMsg="Obtendo visualizações" data={{id: 'none', count: this.state.countViews}} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <StatsBlock icon="thumb_up" title="Curtidas" loadingMsg="Obtendo avaliações" data={{id: 'none', count: this.state.countLikes}} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <StatsBlock icon="comment" title="Comentários" loadingMsg="Obtendo comentários" data={{id: 'none', count: this.state.countComments}} />
                                </Grid>
                            </Grid>
                        </Box>
                        <Box>
                        <Box pl={5} pr={5}>
                            <Box display="flex" alignItems="center" width="100%">
                                    <Box mr={1}>
                                        <Icon>chat_bubble_outline</Icon>
                                    </Box>
                                    <Box>
                                        <h4>Comentários</h4>
                                    </Box>
                                </Box>
                            </Box>
                            { this.state.comments.length > 0 && !this.state.loading &&
                                <Paper>
                                    <Container className="wrapper">
                                        <Table className="defaultTable">
                                            {/* Header da tabela */}
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>
                                                        <span className="centerVertical">
                                                            <Icon fontSize="small" className="marginRight">
                                                                file_copy
                                                            </Icon>
                                                            Artigo
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="centerVertical">
                                                            <Icon fontSize="small" className="marginRight">
                                                                person
                                                            </Icon>
                                                            Leitor
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="centerVertical">
                                                            <Icon fontSize="small" className="marginRight">
                                                            alternate_email
                                                            </Icon>
                                                            E-mail
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="centerVertical">
                                                            <Icon fontSize="small" className="marginRight">
                                                                category
                                                            </Icon>
                                                            Status
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                            {/* Geração dos registros na tabela  */}
                                            {this.state.comments.map(comment => (
                                                <TableRow key={comment._id} id={comment._id} tabIndex="-1">
                                                    <TableCell scope="article.title">
                                                        <a href={`/article/${comment.article.customURL}`} target="_blank" rel="noopener noreferrer">{comment.article.title}</a>
                                                    </TableCell>
                                                    <TableCell scope="userName">
                                                        {comment.userName}
                                                    </TableCell>
                                                    <TableCell scope="userEmail">
                                                        {comment.userEmail}
                                                    </TableCell>
                                                    <TableCell scope="tagAdmin">
                                                        {comment.confirmed ? 
                                                            <CustomChip size="small"
                                                                className="chipTypeUser"
                                                                color="success"
                                                                sizeIcon="small"
                                                                icon="done"
                                                                text="Aprovado"/> : 
                                                            <CustomChip size="small"
                                                                className="chipTypeUser"
                                                                color="gray"
                                                                sizeIcon="small"
                                                                icon="warning"
                                                                text="Não aprovado"
                                                            />
                                                        }
                                                    </TableCell>
                                                    <TableCell scope="_id">
                                                        <CustomIconButton icon="more_horiz"
                                                            aria-label="More" color="default"
                                                            tooltip="Responder comentário"
                                                            onClick={() => this.openComment(comment)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            </TableBody>
                                            {/* Footer da tabela */}
                                            {/*<TableFooter>
                                                <TableRow>
                                                    <TablePagination 
                                                        rowsPerPageOptions={OPTIONS_LIMIT}
                                                        colSpan={4}
                                                        count={this.state.countComments}
                                                        rowsPerPage={this.state.limitComments}
                                                        labelRowsPerPage={LIMIT_LABEL}
                                                        labelDisplayedRows={DISPLAYED_ROWS}
                                                        page={this.state.pageComments - 1}
                                                        SelectProps={{ inputProps: {'aria-label': 'Limite'} }}
                                                        onChangePage={this.changePage}
                                                        
                                                        onChangeRowsPerPage={this.defineLimit}
                                                    />
                                                </TableRow>
                                            </TableFooter>*/}
                                        </Table>
                                    </Container>
                                </Paper>
                            }
                        </Box>
                    </Grid>
                }
                { this.state.error && 
                    <ErrorBlock />
                }
                <Dialog open={this.state.dialogAnswer} onClose={() => this.setState({dialogAnswer: false})} aria-labelledby="form-dialog-title">
                    <DialogTitle id="form-dialog-title">Responda o comentário de {this.state.comment.userName}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {this.state.comment.comment}
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="answer"
                            label="Resposta"
                            type="text"
                            multiline
                            fullWidth
                            value={this.state.value}
                            onChange={(event) => this.setState({answer: event.target.value})}
                        />
                    </DialogContent>
                    <DialogActions>
                        <CustomButton 
                            text="Cancelar"
                            onClick={() => {
                                const op = window.confirm('Tem certeza que deseja sair?')
                                if(op)
                                    this.closeAnswerDialog()
                            }} 
                            color="danger"
                            variant="contained"
                            icon="clear"
                        />
                        <CustomButton
                            text="Enviar"
                            onClick={() => this.sendAnswer()}
                            color="success"
                            variant="contained"
                            icon="save"
                        />
                    </DialogActions>
                </Dialog>
            </Grid>
        )
    }
}

export default ArticleStats
