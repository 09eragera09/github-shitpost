import React, {Component} from 'react';
import './App.css';
import Moment from 'react-moment';

const swears = require("./data_curated.json");
const token = "&access_token=e439735ef24afd3844c6add734f5af579ec8560f";
const equals = require("array-equal");

class App extends Component {

    constructor(props) {
        super(props);
        let swearList = swears.slice(0, 6);
        let checkBoxList = Array(swears.length).fill(null).map((value, index) => {
            return index < 6;
        });
        let disableCheckBoxList = checkBoxList.map(e => !e);
        let checkBoxCounter = 6;
        this.state = {
            swears: swears,
            swearList: swearList,
            default: 20,
            checkBoxList: checkBoxList,
            checkBoxCounter: checkBoxCounter,
            disableCheckBoxList: disableCheckBoxList,
            commitList: [],
            alphabetSort: true
        }
    }

    static getLoading() {
        return (<div className={"center loading"}>
            <span>LOADING</span>
        </div>)
    }

    async gitHubAPISearch(swearList) {
        this.setState({
            commitList: []
        });
        let a = await fetch(`https://api.github.com/search/commits?q=${swearList.map(e => e.expletive).join("+OR+")}${token}`, {headers: {"Accept": "application/vnd.github.cloak-preview"}});
        let res = await a.json();
        let count = 20;
        if (res.total_count < 20) {
            count = res.total_count;
        }
        let commitList = res.items.slice(0, count);
        this.setState({
            commitList: commitList,
            default: count,
            swearList: swearList
        });
    }

    sortByKey(array, key) {
        return array.sort(function (a, b) {
            const x = a[key];
            const y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }

    async componentDidMount() {
        await this.gitHubAPISearch(this.state.swearList);
    }

    getCommits() {
        return (
            <ul className={"commitList"}>
                {Array(this.state.commitList.length).fill(null).map((value, index) => {
                    let commit = this.state.commitList[index];
                    return (<li key={commit.repository.id + commit.sha}>
                        <div className="flex-row commit-parent">
                            <div className="flex-column">
                                <span className="message">
                                    <a className={"links"} href={commit.html_url}>
                                        {commit.commit.message.length > 150 ? commit.commit.message.substring(0, 150) + "..." : commit.commit.message}
                                    </a>
                                </span>
                                <div className="flex-row author">
                                    <span className={"avatarParent"}>
                                        <img
                                            src={commit.author ? commit.author.avatar_url : (commit.committer ? commit.committer.avatar_url : require("./assets/s.png"))}
                                            alt={"GitHubLogo"} height="20" width="20"/>
                                    </span>
                                    <span className="name">
                                        <a className={"links"}
                                           href={commit.author ? commit.repository.html_url + `/commits?author=` + commit.author.login : (commit.committer ? commit.repository.html_url + `/commits?author=` + commit.committer.login : "")}>
                                            {commit.commit.author ? commit.commit.author.name : commit.commit.committer.name}
                                        </a>

                                    </span>
                                    <span className={"commit-date"}>&nbsp;commited on&nbsp;
                                        <Moment format="d MMM YYYY">{
                                            commit.commit.committer.date
                                        }</Moment>
                                    </span>
                                </div>
                            </div>
                            <div className="commit-btn-parent flex-row">
                                <a className="sha" href={commit.html_url}>{commit.sha.substring(0, 6)}</a>
                                <a href={commit.commit.tree.url}>
                                    <svg className="octicon octicon-code" viewBox="0 0 14 16" version="1.1" width="14"
                                         height="16" aria-hidden="true">
                                        <path className={"arrowpath"} fillRule="evenodd"
                                              d="M9.5 3L8 4.5 11.5 8 8 11.5 9.5 13 14 8 9.5 3zm-5 0L0 8l4.5 5L6 11.5 2.5 8 6 4.5 4.5 3z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </li>)
                })}</ul>
        )
    }

    handleChange(event, index) {
        let counter = this.state.checkBoxCounter;
        let disableThis = this.state.disableCheckBoxList.slice();
        let arr = this.state.checkBoxList.slice();
        if (arr[index] === true) {
            --counter;
        } else {
            ++counter;
        }
        arr[index] = !arr[index];
        if (counter >= 6) {
            disableThis = arr.map(e => !e);
        } else {
            disableThis = disableThis.fill(false);
        }
        this.setState({
            checkBoxList: arr,
            checkBoxCounter: counter,
            disableCheckBoxList: disableThis
        })
    }

    setSearchTerms() {
        return (
            <div className={"tags"}>
                {Array(this.state.swears.length).fill(null).map((value, index) => {
                    return (
                        <span key={this.state.swears[index].expletive}
                              className={this.state.checkBoxList[index] ? "checkBox-checked" : ""}>
                            <label>
                                {this.state.swears[index].expletive}
                                <input type={"checkbox"} disabled={this.state.disableCheckBoxList[index]}
                                       checked={this.state.checkBoxList[index]} onChange={(e) => {
                                    this.handleChange(e, index)
                                }}/>
                            </label>
                        </span>
                    )
                })}
            </div>
        )
    }

    async searchGithub() {
        let checkBoxList = this.state.checkBoxList.slice();
        console.log(checkBoxList);
        console.log(this.state.checkBoxCounter);
        let tagsToSearch = this.state.swears.map((value, index) => {
            if (checkBoxList[index]) {
                return value;
            } else {
                return undefined
            }
        }).filter(Boolean);
        if (equals(tagsToSearch, this.state.swearList) || tagsToSearch.length === 0) {
            return
        }
        await this.gitHubAPISearch(tagsToSearch)
    }

    clearAll() {
        let slicedArray = this.state.checkBoxList.slice();
        slicedArray.fill(false);
        this.setState({
            checkBoxList: slicedArray,
            disableCheckBoxList: slicedArray,
            checkBoxCounter: 0,
        })
    }

    sortListing() {
        let list;
        if (this.state.alphabetSort) {
            list = this.state.swears.slice();
            list = this.sortByKey(list, 'expletive');
        } else {
            list = swears.slice();
        }
        this.setState({
            swears: list,
            alphabetSort: !this.state.alphabetSort,
        });
        this.clearAll()
    }

    searchButton() {
        return (
            <div className={"center btn-parent"}>
                <span onClick={() => {
                    this.sortListing()
                }}>{this.state.alphabetSort ? "Sort Alphabetically" : "Sort by Popularity"}</span>
                <span onClick={() => {
                    this.clearAll()
                }}>Clear</span>
                <span onClick={() => this.searchGithub()}>Search</span>
            </div>
        )
    }

    render() {
        return (
            <div>
                <header>
                    <h1>GitHub ShitPost</h1>
                    <h3>Putting the shit in shitpost</h3>
                </header>
                <div>
                    {this.setSearchTerms()}
                    <div className={"center"}>
                        {this.state.checkBoxCounter === 0 ? "You must specify at least 1 tag to search" : "You can specify a max of 6 tags"}
                    </div>
                    {this.searchButton()}
                </div>
                <div>{
                    this.state.commitList.length !== 0 ? this.getCommits() : App.getLoading()
                }
                </div>
            </div>
        );
    }
}

export default App;
