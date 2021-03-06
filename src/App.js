import React, { Component } from 'react';
// import * as firebase from 'firebase';
import {Grid, Row, Col, Panel, Well, ListGroup, ListGroupItem, Checkbox, Glyphicon, Button, ButtonGroup} from 'react-bootstrap';
import AddToList from './addtolist';
import db from './Indexed_db/indexdb';
import ConfirmationModal from './modals/confirmation-modal';
import Utilities from './utilities';

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      todos: [],
      donetodos : [],
      isUpdating: false,
      updatingId: 0,
      isLoading: false
    }
    this.todoDone = this.todoDone.bind(this);
    this.removeFromDone = this.removeFromDone.bind(this);
    this.onChange = this.onChange.bind(this);
    this.addToTodo = this.addToTodo.bind(this);
    this.priorityClass = this.priorityClass.bind(this);
    this.removeTodo = this.removeTodo.bind(this);
    this.editTodo = this.editTodo.bind(this);
    this.cancel = this.cancel.bind(this);
    this.confirmationForDelete = this.confirmationForDelete.bind(this);
  };

  /**
   * select from todo
  */
  todoDone(e){
    this.setState({
      isLoading: true
    });
    let todolist = this.state.todos.slice();
    const selectedTodoId = parseInt(e.target.value, 0);
    let completedTodo = todolist.filter((obj) =>  obj.id === selectedTodoId)[0];
        completedTodo.timestamp = Utilities.createdTimeStamp();
    db.table('todos').update(selectedTodoId, {done: true}).then((todo)=>{
      let completedTodoState = todolist.find(function (value) { return  value.id === selectedTodoId});

      completedTodoState.done = !completedTodoState.done;

      db.table('donetodos').add(completedTodo).then((id)=>{
        this.setState(prevState => ({
          donetodos: Utilities.sortArrTimeDesc([...prevState.donetodos, completedTodo], 'timestamp'),
          isLoading: false
        }))
      });

    }).catch((error)=>{
      console.log(error);
    })
  };

  /**
   * remove from done list
   */
  removeFromDone(id){
    this.setState({
      isLoading: true
    });
    db.table('donetodos').delete(id).then(()=>{      
      db.table('todos').update(id, {done: false}).then((todo)=>{
        db.table('todos').toArray().then((todos)=>{
          db.table('donetodos').toArray().then((donetodo)=>{
            this.setState({
              todos:Utilities.sortArrTimeDesc(todos, 'timestamp'),
              donetodos: Utilities.sortArrTimeDesc(donetodo, 'timestamp'),
              isLoading: false
            });
          })
        })

      })

    }).catch((e)=>{
      console.log(e);
    })
  }
  
  /**
   * method insert data into todo list
   */
  addToTodo(data){
    this.setState({
      isLoading: true
    });
   
    let todolist = this.state.todos;
    let isKeyExist = todolist.find(function (obj) { return obj.id === data.id });
    if (todolist.length > 0 && isKeyExist){
        todolist.forEach((key, index)=>{
          if (key.id === data.id){            
            data.timestamp = key.timestamp
            db.table('todos').update(data.id, data).then(()=>{
                db.table('todos').toArray().then((todos) => {
                  this.setState({
                    todos: Utilities.sortArrTimeDesc(todos, 'timestamp'),
                    isUpdating: false,
                    updatingId: 0,
                    isLoading: false
                  })
              });
            }).catch(function (e) {
              console.error(e);
            });
          }
        })
    }else{
      db.table('todos').add(data).then((id) => {
        this.setState(prevState =>({
          todos: Utilities.sortArrTimeDesc([...prevState.todos, data], 'timestamp'),
          isLoading: false
        }))
      }).catch(function (e) { 
        console.error(e);
      });
    }
  };
  
  /**
   * handler for remove item from todo list
   */
  confirmationForDelete(idFor){
    this.refs.modalReference.handleShow(idFor);
  }
  removeTodo(id){
    db.table('todos').delete(id).then(() => {
      const newList = this.state.todos.filter((todo) => todo.id !== id);
      this.setState(prevState => ({
        todos: newList,
        isLoading: false
      }))
      this.refs.modalReference.handleClose();
    }).catch(function (e) {
      console.error(e);
    });
  };

  /** 
   * handler for todo list item
  */
  editTodo(id){
    let editId = this.state.todos.filter(item =>
      item.id === id
    )
    this.child.EditTodoHandler(editId);
    this.setState({
      isUpdating: true,
      updatingId: id
    })
  };
  /**
   *  cancel editing
   */
  cancel(){
    this.setState({
      isUpdating: false,
      updatingId: 0
    })
  }
  /**
   * switch priority className as per priority lavel
   */
  priorityClass(priority){
    let pClass;
    switch (priority) {
      case 1:
        pClass = 'high-priority';
        break;
      case 2:
        pClass = 'medium-priority';
        break;
      case 3:
        pClass = 'low-priority';
        break;
      default:
        pClass = '';
    }
    return pClass;
  };
  
  /** 
  * init state of todo priority
  */
  componentDidMount(){
    // Initialize Firebase
    // var config = {
    //   apiKey: "AIzaSyAEI9LIEtSjKsC6sHDHOeoky2l0pp3OVpc",
    //   authDomain: "todos-aeb59.firebaseapp.com",
    //   databaseURL: "https://todos-aeb59.firebaseio.com",
    //   projectId: "todos-aeb59",
    //   storageBucket: "todos-aeb59.appspot.com",
    //   messagingSenderId: "96043356152"
    // };
    // firebase.initializeApp(config);
    // var database = firebase.database().ref().child('todotable');
    // var todo = database.child('todo');
    // todo.on('value', function(snap){
    //   console.log(todo)
    //   snap.val();
    // })

    this.setState({
      isLoading: true
    })
    db.table('todos').toArray().then((todos) => {
        this.setState({
          todos: Utilities.sortArrTimeDesc(todos, 'timestamp'),
          isLoading: false
        })   
    });
    db.table('donetodos').toArray().then((donetodos) => {
      this.setState({
        donetodos: Utilities.sortArrTimeDesc(donetodos, 'timestamp'),
        isLoading: false
      })
    });
    
  };

  onChange(){}
  
  render() {
    const hasSelected = this.state.donetodos;
    let data = this.state.todos;
    let RemainingTodo = function(){
      return data.filter((x)=>{
        return !x.done;
      }).length;
    }

    /*todo list*/
    const defaultList = data.map((x)=>{
      let bgstyle = (this.state.updatingId === x.id) ? 'list-group-item-warning' : "";
        return(
          <ListGroupItem key={x.id} className={this.priorityClass(x.priority) + ' todo-list '+ bgstyle} disabled={x.done === true}>
            <ButtonGroup className="pull-right">
              <Button bsSize="xs" bsStyle="primary" disabled={x.done === true || (this.state.updatingId === x.id)} onClick={this.editTodo.bind(this, x.id)}>
                <Glyphicon glyph="edit" />
              </Button>
              <Button bsSize="xs" bsStyle="danger" disabled={(this.state.updatingId === x.id)} onClick={this.confirmationForDelete.bind(this, x.id)}>
                <Glyphicon glyph="remove" />
              </Button>
            </ButtonGroup>    
            <Checkbox inline 
              value = {x.id} 
              checked = {x.done === true}
              disabled={x.done === true || (this.state.updatingId === x.id)} 
              onChange = {this.onChange} onClick={this.todoDone}>
              <div>
                {x.text} <i className="small">{(this.state.updatingId === x.id) ? 'Editing' : ''} </i>
                <div className="small text-muted">
                  <i>{(x.priority === 1) ? 'High Priority' : '' || (x.priority === 2) ? 'Medium Priority' : '' || (x.priority === 3) ? 'Low Priority' : ''}</i>
                  &nbsp;&nbsp;|&nbsp;&nbsp; 
                  <i className="text-muted">{x.date}</i>
                </div>
              </div>
            </Checkbox>
          </ListGroupItem>
        )
    })
    /*done list*/
    const selectedList = hasSelected.map((itm) => <ListGroupItem key={itm.id} className={this.priorityClass(itm.priority) + ' todo-list'}> 
                                                    <a className="pull-right close" onClick={this.removeFromDone.bind(this, itm.id)}>
                                                      <span aria-hidden="true">&times;</span>
                                                    </a>
                                                    <div className="overflow">{itm.text}</div>
                                                    <div className="small text-muted">
                                                      <i>{(itm.priority === 1) ? 'High Priority' : '' || (itm.priority === 2) ? 'Medium Priority' : '' || (itm.priority === 3) ? 'Low Priority' : ''}</i>
                                                    </div>
                                                  </ListGroupItem>);
    return (
      <Grid>
        <Row>
          <Col lg={6} lgOffset={3}>
            <br />
            <Well>
                <AddToList ref={instance => { this.child = instance; }} cancel={this.cancel} addtoListHandler={this.addToTodo} isUpdating={this.state.isUpdating} updatingId={this.state.updatingId}/>
            </Well>
          </Col>
          <Col lg={6}>
            <Panel>
              <Panel.Heading>
                <Panel.Title componentClass="h3">
                  {(this.state.isLoading) &&
                    <span className="pull-right text-muted">
                      Loading...
                    </span>
                  }
                Todos
                </Panel.Title>
              </Panel.Heading>
              {(!data.length && !this.state.isLoading) &&
                <div className="text-center no-data">
                  <h4><Glyphicon glyph="alert" /></h4>
                  <h4>There are no Todo to show</h4>
                </div>
              }
              {data.length > 0 &&
              <ListGroup>
                <ListGroupItem bsStyle={RemainingTodo() ? "info": "success"}>Remaining: {RemainingTodo()}</ListGroupItem>
                {defaultList}
              </ListGroup>
              }
            </Panel>
          </Col>
        
          {hasSelected.length > 0 && <Col lg={6}>
            <Panel>
              <Panel.Heading>
                <Panel.Title componentClass="h3">Finished Todos</Panel.Title>
              </Panel.Heading>
              <ListGroup>
                {selectedList}
              </ListGroup>
            </Panel>            
          </Col>
          }
        </Row>
        <ConfirmationModal ref="modalReference" permissionHandler={this.removeTodo} msg={"Are you sure, you want to do this action?"}></ConfirmationModal>
      </Grid>
    );
  }
}
export default App;

