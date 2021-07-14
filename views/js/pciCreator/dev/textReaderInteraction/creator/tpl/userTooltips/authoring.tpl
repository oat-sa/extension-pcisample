{{#if tooltips.length}}
    <hr />
    <h3>{{__ "Tooltips"}}</h3>
    <div class="panel">
        {{#each tooltips}}
        <div>
            <label class="smaller-prompt tooltip-edit" data-identifier="{{id}}">
                <b>{{label}}</b>
                <a href="#" class="tooltip-delete" title="{{__ 'Remove Tooltip'}}">
                    <span class="icon-bin"></span>
                </a>
                <textarea name="{{id}}" class="tooltip-content-edit">{{content}}</textarea>
            </label>
        </div>
        {{/each}}
    </div>
{{/if}}
